"""Servidor local autónomo de GIM-MED. Solo usa la biblioteca estándar de Python.

El puerto y el rol se configuran en config.py. Cada copia escribe únicamente en
su propia carpeta data/, por lo que trasladar su carpeta conserva sus datos.
"""
import base64
from email.parser import BytesParser
from email import policy
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import sys
import time
from datetime import datetime
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from config import PORT, ROLE, SECTION

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
DB = DATA / "gimmed.sqlite"
WEB = ROOT / "web"
SESSION_KEY = DATA / "session.key"
SESSION_TTL = 12 * 3600


def now():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    return db


def initialize():
    DATA.mkdir(exist_ok=True)
    if not SESSION_KEY.exists():
        SESSION_KEY.write_bytes(secrets.token_bytes(32))
    with connect() as db:
        db.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
        if ROLE == "Enfermería" and not db.execute("SELECT 1 FROM beds").fetchone():
            for number in range(1, 5):
                db.execute("INSERT INTO beds(code,label,area) VALUES(?,?,?)",
                           (f"C-{number:02}", f"Cama {number:02}", "Hospitalización"))


def password_hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 260000).hex()


def token_for(row):
    payload = f"{row['id']}:{int(time.time()) + SESSION_TTL}"
    signature = hmac.new(SESSION_KEY.read_bytes(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}:{signature}".encode()).decode()


def session(handler, db):
    jar = SimpleCookie()
    try:
        jar.load(handler.headers.get("Cookie", ""))
        value = jar["gimmed_session"].value
        account_id, expiry, digest = base64.urlsafe_b64decode(value.encode()).decode().split(":")
        payload = f"{account_id}:{expiry}"
        expected = hmac.new(SESSION_KEY.read_bytes(), payload.encode(), hashlib.sha256).hexdigest()
        if int(expiry) < time.time() or not hmac.compare_digest(digest, expected):
            return None
        return db.execute("SELECT * FROM accounts WHERE id=?", (account_id,)).fetchone()
    except (KeyError, ValueError, TypeError, UnicodeError):
        return None


def obj(row):
    return json.loads(row["payload"])


def patient_obj(row):
    data = obj(row)
    data.update(id=row["id"], fileNumber=row["file_number"], full_name=row["full_name"],
                file_number=row["file_number"], identification=row["identification"],
                updated_at=row["updated_at"])
    return data


def nurse_patient(row, db):
    data = patient_obj(row)
    records = db.execute("SELECT * FROM clinical_records WHERE patient_id=? ORDER BY id DESC", (row["id"],)).fetchall()
    vitals = []
    detailed = []
    for record in records:
        payload = obj(record)
        entry = {**payload, "tipo": record["kind"], "fecha": record["created_at"][:10],
                 "hora": record["created_at"][11:16], "enfermera": record["author"],
                 "fecha_sistema": record["created_at"][:10], "hora_sistema": record["created_at"][11:16]}
        detailed.append(entry)
        if record["kind"] == "signos":
            vitals.append(entry)
    bed = db.execute("SELECT label FROM beds WHERE patient_id=?", (row["id"],)).fetchone()
    return {"id": row["id"], "nombre": row["full_name"], "expediente": row["file_number"],
            "identificacion": row["identification"], "alergias": data.get("allergies", data.get("alergias", "Ninguna")),
            "edad": data.get("age", data.get("edad", "")), "sangre": data.get("bloodType", data.get("sangre", "")),
            "fecha_nacimiento": data.get("birthDate", ""), "sexo": data.get("gender", ""),
            "telefono": data.get("phone", ""), "direccion": data.get("address", ""),
            "contacto_emergencia": data.get("emergencyContact", ""), "seguro": data.get("insuranceProvider", ""),
            "antecedentes": data.get("personalHistory", ""), "diagnostico": data.get("diagnosis", ""),
            "ultimos_signos": "Registrados" if vitals else "Sin registros",
            "hospitalizacion": bed["label"] if bed else "No hospitalizado",
            "medicamentos_activos": [], "signos_historial": vitals,
            "registros_detallados": detailed,
            "historial": [{"tipo": r["kind"], "fecha": r["created_at"][:10],
                           "diagnostico": obj(r).get("diagnostico", ""),
                           "observaciones": obj(r).get("observaciones", ""), "profesional": r["author"]}
                          for r in records]}


def resource_row(row):
    return {**obj(row), "id": row["id"]}


class Handler(BaseHTTPRequestHandler):
    server_version = "GIM-MED autónomo"

    def reply(self, value, status=200, extra=None):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        for key, val in (extra or {}).items():
            self.send_header(key, val)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, target):
        self.send_response(302)
        self.send_header("Location", target)
        self.end_headers()

    def file(self, path):
        try:
            path = path.resolve(strict=True)
            if not path.is_relative_to(WEB.resolve()) or not path.is_file():
                self.send_error(404)
                return
            content = path.read_bytes()
            mime, _ = mimetypes.guess_type(path.name)
            self.send_response(200)
            self.send_header("Content-Type", (mime or "application/octet-stream") + ("; charset=utf-8" if path.suffix in (".html", ".css", ".js") else ""))
            self.send_header("Content-Length", str(len(content)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(content)
        except OSError:
            self.send_error(404)

    def body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 10_000_000:
            raise ValueError("El contenido supera 10 MB.")
        raw = self.rfile.read(length)
        kind = self.headers.get("Content-Type", "")
        if kind.startswith("multipart/form-data"):
            message = BytesParser(policy=policy.default).parsebytes(
                b"MIME-Version: 1.0\r\nContent-Type: " + kind.encode() + b"\r\n\r\n" + raw)
            return {part.get_param("name", header="content-disposition"): part.get_content()
                    for part in message.iter_parts() if part.get_param("name", header="content-disposition") != "foto"}
        if "application/x-www-form-urlencoded" in kind:
            return {key: vals[0] for key, vals in parse_qs(raw.decode()).items()}
        return json.loads(raw or b"{}")

    def do_GET(self):
        self.handle_request("GET")

    def do_POST(self):
        self.handle_request("POST")

    def do_PATCH(self):
        self.handle_request("PATCH")

    def do_PUT(self):
        self.handle_request("PUT")

    def do_DELETE(self):
        self.handle_request("DELETE")

    def handle_request(self, method):
        url = urlsplit(self.path)
        path = unquote(url.path)
        params = {key: vals[0] for key, vals in parse_qs(url.query).items()}
        if method != "GET" and self.headers.get("Origin") not in (None, f"http://127.0.0.1:{PORT}", f"http://localhost:{PORT}"):
            self.reply({"message": "Origen no autorizado."}, 403)
            return
        try:
            with connect() as db:
                account = session(self, db)
                count = db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]
                if path == "/api/status" and method == "GET":
                    return self.reply({"setup": count == 0, "role": ROLE, "section": SECTION,
                                       "loggedIn": bool(account)})
                if path == "/api/setup" and method == "POST":
                    if count:
                        return self.reply({"message": "La cuenta inicial ya existe."}, 409)
                    data = self.body()
                    username = str(data.get("username", "")).strip()
                    display = str(data.get("displayName", "")).strip()
                    password = str(data.get("password", ""))
                    if len(username) < 4 or len(display) < 3 or len(password) < 8:
                        return self.reply({"message": "Nombre y usuario válidos; contraseña de al menos 8 caracteres."}, 400)
                    salt = secrets.token_hex(16)
                    db.execute("INSERT INTO accounts(username,display_name,role,password_salt,password_hash) VALUES(?,?,?,?,?)",
                               (username, display, ROLE, salt, password_hash(password, salt)))
                    return self.reply({"message": "Cuenta creada. Inicie sesión."}, 201)
                if path == "/api/login" and method == "POST":
                    data = self.body()
                    row = db.execute("SELECT * FROM accounts WHERE username=? COLLATE NOCASE",
                                     (str(data.get("username", "")).strip(),)).fetchone()
                    if not row or row["role"] != ROLE or not hmac.compare_digest(row["password_hash"], password_hash(str(data.get("password", "")), row["password_salt"])):
                        return self.reply({"message": "Usuario o contraseña incorrectos."}, 401)
                    return self.reply({"session": {"username": row["username"], "displayName": row["display_name"],
                                                   "role": ROLE, "accountId": row["id"]}}, extra={
                        "Set-Cookie": "gimmed_session=" + token_for(row) + "; HttpOnly; SameSite=Lax; Path=/"})
                if path == "/":
                    return self.file(WEB / "login.html") if not account else self.redirect(f"/interfaces/{SECTION}/" + ("Admin.html" if SECTION == "admin" else "index.html"))
                if path in ("/login.css", "/login.js", "/bootstrap.js", "/assets/gimmed-logo.jpeg"):
                    return self.file(WEB / path.lstrip("/"))
                if not account:
                    return self.reply({"message": "Inicie sesión."}, 401) if path.startswith("/api/") else self.redirect("/")
                if path == "/api/logout" and method == "POST":
                    return self.reply({"ok": True}, extra={"Set-Cookie": "gimmed_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"})
                if path == "/api/session" and method == "GET":
                    return self.reply({"username": account["username"], "displayName": account["display_name"],
                                       "role": ROLE, "accountId": account["id"]})
                if path == "/api/change-password" and method == "POST":
                    return self.change_password(db, account, self.body())
                if path.startswith("/api/"):
                    return self.api(method, path, params, db, account)
                if path == "/registrar-paciente":
                    return self.file(WEB / "registrar-paciente.html")
                if path == "/registrar-medicamento" and ROLE == "Enfermería":
                    return self.file(WEB / "registrar-medicamento.html")
                if path.startswith(f"/interfaces/{SECTION}/"):
                    sub = path[len(f"/interfaces/{SECTION}/"):]
                    return self.file(WEB / "interfaces" / SECTION / (sub or "index.html"))
                return self.send_error(404)
        except (ValueError, TypeError, sqlite3.IntegrityError) as exc:
            self.reply({"ok": False, "error": str(exc), "message": str(exc)}, 400)
        except Exception:
            self.log_error("Error de servidor: %s", sys.exc_info()[1])
            self.reply({"ok": False, "error": "Error interno", "message": "Error interno"}, 500)

    def change_password(self, db, account, data):
        old = str(data.get("currentPassword", data.get("actual", data.get("anterior", ""))))
        new = str(data.get("password", data.get("nueva", data.get("nueva_password", ""))))
        confirm = str(data.get("confirmation", data.get("confirmacion", data.get("confirmar", new))))
        if not hmac.compare_digest(account["password_hash"], password_hash(old, account["password_salt"])):
            return self.reply({"message": "La contraseña actual es incorrecta."}, 400)
        if len(new) < 8 or new != confirm:
            return self.reply({"message": "La contraseña nueva debe tener al menos 8 caracteres y coincidir."}, 400)
        salt = secrets.token_hex(16)
        db.execute("UPDATE accounts SET password_salt=?,password_hash=? WHERE id=?", (salt, password_hash(new, salt), account["id"]))
        return self.reply({"ok": True, "message": "Contraseña actualizada."})

    def api(self, method, path, params, db, account):
        if ROLE == "Administrador":
            return self.admin(method, path, params, db)
        if ROLE == "Médico":
            return self.medico(method, path, params, db, account)
        return self.enfermeria(method, path, params, db, account)

    def patients(self, db, query=""):
        rows = db.execute("SELECT * FROM patients ORDER BY id DESC").fetchall()
        return [row for row in rows if query.lower() in (row["full_name"] + " " + row["file_number"] + " " + row["identification"]).lower()]

    def create_patient(self, db, data):
        full = str(data.get("fullName", data.get("full_name", ""))).strip()
        if not full:
            full = " ".join(str(data.get(key, "")).strip() for key in ("firstName", "secondName", "lastName", "secondLastName")).strip()
        if not full:
            raise ValueError("Escriba el nombre del paciente.")
        row_id = data.get("id")
        file_number = str(data.get("fileNumber", "")).strip()
        identification = str(data.get("identification", "")).strip()
        if row_id:
            existing = db.execute("SELECT * FROM patients WHERE id=?", (row_id,)).fetchone()
            if not existing:
                raise ValueError("El paciente no existe.")
            file_number = file_number or existing["file_number"]
            db.execute("UPDATE patients SET file_number=?,full_name=?,identification=?,payload=?,updated_at=? WHERE id=?",
                       (file_number, full, identification, json.dumps(data, ensure_ascii=False), now(), row_id))
        else:
            if not file_number:
                file_number = "EXP-" + datetime.now().strftime("%Y") + "-" + f"{db.execute('SELECT COALESCE(MAX(id),0)+1 FROM patients').fetchone()[0]:03}"
            db.execute("INSERT INTO patients(file_number,full_name,identification,payload,updated_at) VALUES(?,?,?,?,?)",
                       (file_number, full, identification, json.dumps(data, ensure_ascii=False), now()))
            row_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        return patient_obj(db.execute("SELECT * FROM patients WHERE id=?", (row_id,)).fetchone())

    def admin(self, method, path, params, db):
        if path == "/api/state":
            if method == "GET":
                row = db.execute("SELECT payload FROM app_state WHERE id=1").fetchone()
                return self.reply(json.loads(row[0]) if row else {})
            if method == "PUT":
                data = self.body()
                db.execute("INSERT INTO app_state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload", (json.dumps(data, ensure_ascii=False),))
                return self.reply({"ok": True})
        if path == "/api/admin/users" and method == "POST":
            data = self.body()
            username = str(data.get("username", "")).strip()
            if not username or len(str(data.get("temporaryPassword", ""))) < 8:
                return self.reply({"message": "Usuario y contraseña temporal de ocho caracteres requeridos."}, 400)
            salt = secrets.token_hex(16)
            db.execute("INSERT INTO accounts(username,display_name,role,password_salt,password_hash) VALUES(?,?,?,?,?)",
                       (username, data.get("displayName", username), data.get("role", ROLE), salt,
                        password_hash(data["temporaryPassword"], salt)))
            return self.reply({"ok": True}, 201)
        if path == "/api/patients":
            if method == "GET":
                return self.reply({"patients": [patient_obj(r) for r in self.patients(db)]})
            if method in ("POST", "PATCH"):
                data = self.body()
                if method == "POST":
                    # El id creado en el navegador no es una clave de esta base SQLite.
                    data.pop("id", None)
                return self.reply({"patient": self.create_patient(db, data)}, 201 if method == "POST" else 200)
        kinds = {"/api/employees": ("employees", "employee"), "/api/medications": ("medications", "medication"),
                 "/api/appointments": ("appointments", "appointment"), "/api/invoices": ("invoices", "invoice")}
        if path in kinds:
            plural, singular = kinds[path]
            if method == "GET":
                return self.reply({plural: [resource_row(r) for r in db.execute("SELECT * FROM resources WHERE kind=? ORDER BY id DESC", (plural,))]})
            if method == "DELETE":
                db.execute("DELETE FROM resources WHERE id=? AND kind=?", (params.get("id"), plural))
                return self.reply({"ok": True})
            data = self.body()
            if method == "POST":
                if plural == "appointments":
                    data["scheduledAt"] = f"{data.get('date', '')}T{data.get('time', '')}:00"
                if plural == "invoices":
                    data["invoiceNumber"] = "FAC-" + datetime.now().strftime("%Y") + "-" + f"{db.execute('SELECT COALESCE(MAX(id),0)+1 FROM resources').fetchone()[0]:04}"
                    data["issuedAt"] = now()
                    data["total"] = sum(float(i.get("quantity", 0))*float(i.get("unitPrice", 0)) for i in data.get("items", [])) - float(data.get("discount", 0)) + float(data.get("tax", 0))
                db.execute("INSERT INTO resources(kind,payload) VALUES(?,?)", (plural, json.dumps(data, ensure_ascii=False)))
                row_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            else:
                row_id = data.get("id")
                existing = db.execute("SELECT * FROM resources WHERE id=? AND kind=?", (row_id, plural)).fetchone()
                if not existing:
                    return self.reply({"message": "Registro no encontrado."}, 404)
                data = {**obj(existing), **data}
                if plural == "appointments":
                    data["scheduledAt"] = f"{data.get('date', '')}T{data.get('time', '')}:00"
                db.execute("UPDATE resources SET payload=? WHERE id=?", (json.dumps(data, ensure_ascii=False), row_id))
            row = db.execute("SELECT * FROM resources WHERE id=?", (row_id,)).fetchone()
            return self.reply({singular: resource_row(row)}, 201 if method == "POST" else 200)
        return self.reply({"message": "Ruta no encontrada."}, 404)

    def record(self, db, patient, kind, data, author):
        title = str(data.get("titulo", data.get("procedimiento", kind))).strip() or kind
        db.execute("INSERT INTO clinical_records(patient_id,kind,title,payload,author,created_at) VALUES(?,?,?,?,?,?)",
                   (patient["id"], kind, title, json.dumps(data, ensure_ascii=False), author, now()))
        return {"id": db.execute("SELECT last_insert_rowid()").fetchone()[0], "author": author}

    def medico(self, method, path, params, db, account):
        if path == "/api/pacientes":
            if method == "POST":
                return self.reply({"ok": True, "patient": self.create_patient(db, self.body())}, 201)
            return self.reply({"ok": True, "patients": [self.doctor_patient(r) for r in self.patients(db, params.get("nombre", ""))]})
        if path.startswith("/api/expedientes/"):
            patient = db.execute("SELECT * FROM patients WHERE id=?", (path.rsplit("/", 1)[-1],)).fetchone()
            if not patient:
                return self.reply({"message": "Paciente no encontrado."}, 404)
            all_records = db.execute("SELECT * FROM clinical_records WHERE patient_id=? ORDER BY id DESC", (patient["id"],)).fetchall()
            date = params.get("fecha", "")
            records = [self.doctor_record(r) for r in all_records if not date or r["created_at"].startswith(date)]
            return self.reply({"ok": True, "patient": self.doctor_patient(patient), "records": records,
                               "dates": sorted({r["created_at"][:10] for r in all_records}, reverse=True)})
        if path.startswith("/api/examenes/") and method == "GET":
            rows = db.execute("SELECT * FROM clinical_records WHERE patient_id=? AND kind='solicitar' ORDER BY id DESC", (path.rsplit("/", 1)[-1],)).fetchall()
            return self.reply({"ok": True, "exams": [self.doctor_record(r) for r in rows]})
        kinds = {"/api/consulta": "consulta", "/api/seguimiento": "seguimiento",
                 "/api/examenes/solicitar": "solicitar", "/api/radiografias": "radiografias",
                 "/api/cirugias": "cirugias", "/api/posoperatorio": "posoperatorio"}
        if path in kinds and method == "POST":
            data = self.body()
            patient = db.execute("SELECT * FROM patients WHERE id=?", (data.get("patient_id"),)).fetchone()
            if not patient:
                return self.reply({"message": "Seleccione un paciente registrado."}, 400)
            return self.reply({"ok": True, "message": "Registro clínico guardado.",
                               "record": self.record(db, patient, kinds[path], data, account["display_name"])}, 201)
        if path == "/api/notificaciones":
            if method == "GET":
                return self.reply({"ok": True, "notifications": [dict(r) for r in db.execute("SELECT * FROM notifications ORDER BY id DESC")]})
            data = self.body()
            db.execute("UPDATE notifications SET is_read=1 WHERE " + ("1=1" if data.get("all") else "id=?"), () if data.get("all") else (data.get("id"),))
            return self.reply({"ok": True})
        if path == "/api/respaldos" and method == "POST":
            data = self.body()
            db.execute("INSERT INTO backups(payload) VALUES(?)", (json.dumps(data, ensure_ascii=False),))
            return self.reply({"ok": True, "message": "Borradores respaldados en esta base."})
        if path == "/api/configuracion/perfil" and method == "POST":
            data = self.body()
            display = str(data.get("nombre", data.get("nombre_completo", data.get("name", "")))).strip()
            if display:
                db.execute("UPDATE accounts SET display_name=? WHERE id=?", (display, account["id"]))
            return self.reply({"ok": True, "message": "Perfil actualizado."})
        if path == "/api/configuracion/contrasena" and method == "POST":
            return self.change_password(db, account, self.body())
        return self.reply({"ok": False, "message": "Ruta no encontrada."}, 404)

    def doctor_patient(self, row):
        d = patient_obj(row)
        birth = d.get("birthDate", "")
        try:
            age = int((datetime.now().date() - datetime.fromisoformat(birth).date()).days // 365.2425)
        except (ValueError, TypeError):
            age = d.get("age", "")
        return {**d, "age": age, "blood_type": d.get("bloodType", ""),
                "allergy": d.get("allergies", "Ninguna"), "last_reason": d.get("diagnosis", "Sin registros")}

    def doctor_record(self, row):
        data = obj(row)
        return {"id": row["id"], "record_type": row["kind"], "title": row["title"],
                "summary": data.get("motivo", data.get("evaluacion", "Registro clínico")),
                "created_at": row["created_at"], "author": row["author"], "details": data}

    def enfermeria(self, method, path, params, db, account):
        if path == "/api/pacientes":
            if method == "POST":
                return self.reply({"patient": self.create_patient(db, self.body())}, 201)
            return self.reply([nurse_patient(r, db) for r in self.patients(db, params.get("q", ""))])
        if path.startswith("/api/pacientes/"):
            row = db.execute("SELECT * FROM patients WHERE file_number=?", (path.rsplit("/", 1)[-1],)).fetchone()
            return self.reply(nurse_patient(row, db)) if row else self.reply({"error": "Paciente no encontrado."}, 404)
        if path == "/api/resumen":
            today = datetime.now().strftime("%Y-%m-%d")
            return self.reply({"pacientes": db.execute("SELECT COUNT(*) FROM patients").fetchone()[0],
                               "signos_hoy": db.execute("SELECT COUNT(*) FROM clinical_records WHERE kind='signos' AND created_at LIKE ?", (today + "%",)).fetchone()[0],
                               "hospitalizados": db.execute("SELECT COUNT(*) FROM beds WHERE patient_id IS NOT NULL").fetchone()[0],
                               "camas_disponibles": db.execute("SELECT COUNT(*) FROM beds WHERE patient_id IS NULL").fetchone()[0]})
        if path == "/api/revision":
            row = db.execute("SELECT MAX(id) FROM clinical_records").fetchone()
            return self.reply({"revision": row[0] or 0})
        if path == "/api/camas":
            rows = db.execute("SELECT b.*,p.file_number,p.full_name FROM beds b LEFT JOIN patients p ON p.id=b.patient_id ORDER BY b.code").fetchall()
            return self.reply([{"codigo": r["code"], "etiqueta": r["label"], "area": r["area"],
                                "estado": "Ocupada" if r["patient_id"] else "Disponible",
                                "expediente": r["file_number"], "paciente_nombre": r["full_name"]} for r in rows])
        if path == "/api/medicamentos":
            return self.reply([{"id": r["id"], "codigo": obj(r).get("codigo", ""),
                                "nombre": obj(r).get("nombre", ""), "presentacion": obj(r).get("presentacion", ""),
                                "via": obj(r).get("via", "Oral"), "stock": obj(r).get("stock", 0)}
                               for r in db.execute("SELECT * FROM resources WHERE kind='medicamentos'")
                               if params.get("q", "").lower() in json.dumps(obj(r), ensure_ascii=False).lower()])
        if path == "/api/insumos" and method == "POST":
            data = self.body()
            db.execute("INSERT INTO resources(kind,payload) VALUES('medicamentos',?)", (json.dumps(data, ensure_ascii=False),))
            return self.reply({"ok": True}, 201)
        if path == "/api/registros" and method == "POST":
            data = self.body()
            kind = str(data.get("modulo", "")).strip()
            file_number = str(data.get("expediente", ""))
            patient = db.execute("SELECT * FROM patients WHERE file_number=?", (file_number,)).fetchone()
            if not patient:
                return self.reply({"error": "Seleccione un paciente registrado."}, 400)
            if kind == "hospitalizacion":
                code = str(data.get("cama", ""))
                bed = db.execute("SELECT * FROM beds WHERE code=?", (code,)).fetchone()
                if not bed or (bed["patient_id"] and bed["patient_id"] != patient["id"]):
                    return self.reply({"error": "La cama no está disponible."}, 400)
                db.execute("UPDATE beds SET patient_id=NULL WHERE patient_id=?", (patient["id"],))
                db.execute("UPDATE beds SET patient_id=? WHERE code=?", (patient["id"], code))
                data["cama"] = code
            if kind == "alta":
                bed = db.execute("SELECT code FROM beds WHERE patient_id=?", (patient["id"],)).fetchone()
                if not bed or data.get("alta_autorizada") != "Sí":
                    return self.reply({"error": "Se necesita cama asignada y autorización del médico."}, 400)
                data["cama_liberada"] = bed["code"]
                db.execute("UPDATE beds SET patient_id=NULL WHERE code=?", (bed["code"],))
            saved = self.record(db, patient, kind, data, account["display_name"])
            stamp = datetime.now()
            return self.reply({"message": "Registro guardado.",
                               "registro": {**data, "id": saved["id"], "nombre_paciente": patient["full_name"],
                                            "fecha_sistema": stamp.strftime("%d/%m/%Y"),
                                            "hora_sistema": stamp.strftime("%I:%M %p")}}, 201)
        if path == "/api/notificaciones":
            return self.reply([{"id": r["id"], "titulo": r["title"], "mensaje": r["message"], "leida": bool(r["is_read"])}
                               for r in db.execute("SELECT * FROM notifications ORDER BY id DESC")])
        if path.startswith("/api/notificaciones/") and method == "PUT":
            db.execute("UPDATE notifications SET is_read=1 WHERE id=?", (path.split("/")[-2],))
            return self.reply({"ok": True})
        if path == "/api/perfil":
            row = db.execute("SELECT payload FROM app_state WHERE id=1").fetchone()
            details = json.loads(row[0]) if row else {}
            if method == "PUT":
                details.update(self.body())
                db.execute("INSERT INTO app_state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload", (json.dumps(details, ensure_ascii=False),))
            return self.reply({"nombre": details.get("nombre", account["display_name"]),
                               "cargo": details.get("cargo", "Enfermera general"),
                               "licencia": details.get("licencia", ""),
                               "foto": details.get("foto", "/interfaces/enfermeria/static/img/nurse-profile-default.webp"), **details})
        if path == "/api/perfil/foto" and method == "PUT":
            row = db.execute("SELECT payload FROM app_state WHERE id=1").fetchone()
            details = json.loads(row[0]) if row else {}
            details["foto"] = self.body().get("foto", "")
            db.execute("INSERT INTO app_state(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload", (json.dumps(details, ensure_ascii=False),))
            return self.reply({"ok": True})
        if path == "/api/perfil/password" and method == "PUT":
            return self.change_password(db, account, self.body())
        return self.reply({"error": "Ruta no encontrada."}, 404)


def main():
    initialize()
    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError as exc:
        print(f"No se puede abrir el puerto {PORT}: {exc}")
        return 1
    print(f"GIM-MED {ROLE}: http://localhost:{PORT}/")
    print("Los datos se guardan en data/gimmed.sqlite. Pulse Ctrl+C para cerrar.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

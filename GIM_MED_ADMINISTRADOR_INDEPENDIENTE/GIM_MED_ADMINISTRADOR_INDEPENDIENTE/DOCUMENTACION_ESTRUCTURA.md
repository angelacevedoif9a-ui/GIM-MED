# Estructura de árbol — GIM-MED Administrador

Este archivo describe **el nombre y la función de cada carpeta y archivo** del ZIP. El árbol se genera a partir del contenido real del proyecto.

## Árbol completo

```text
GIM_MED_ADMINISTRADOR_INDEPENDIENTE/  # Proyecto autónomo de Administrador.
├── data/  # Base SQLite y clave de sesiones propias de este proyecto.
│   ├── gimmed.sqlite  # Base SQLite propia: usuarios, pacientes y registros del módulo.
│   └── session.key  # Clave privada para validar las sesiones; conservar al trasladar.
├── web/  # Pantallas, estilos, lógica del navegador e imágenes.
│   ├── assets/  # Logotipo e imágenes.
│   │   └── gimmed-logo.jpeg  # Imagen del logotipo GIM-MED.
│   ├── interfaces/  # Interfaces procedentes del módulo original.
│   │   └── admin/  # Código visual de Administrador.
│   │       ├── assets/  # Logotipo e imágenes.
│   │       │   └── logo-gimmed.jpeg  # Imagen del logotipo GIM-MED.
│   │       ├── citas/  # Programación de citas
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Programación de citas.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Programación de citas.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Programación de citas.
│   │       ├── configuracion/  # Configuración del perfil y apariencia
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Configuración del perfil y apariencia.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Configuración del perfil y apariencia.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Configuración del perfil y apariencia.
│   │       ├── control-acceso/  # Registro y control de acceso
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Registro y control de acceso.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Registro y control de acceso.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Registro y control de acceso.
│   │       ├── core/  # Funciones administrativas compartidas por sus pantallas.
│   │       │   ├── crud.js  # Validación y operaciones para crear, modificar o borrar registros.
│   │       │   ├── reports.js  # Funciones para preparar reportes administrativos.
│   │       │   └── store.js  # Estado administrativo, sesiones locales y sincronización con SQLite.
│   │       ├── especialidades/  # Especialidades médicas
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Especialidades médicas.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Especialidades médicas.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Especialidades médicas.
│   │       ├── facturacion/  # Facturación y pagos
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Facturación y pagos.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Facturación y pagos.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Facturación y pagos.
│   │       ├── inventario/  # Inventario farmacéutico
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Inventario farmacéutico.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Inventario farmacéutico.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Inventario farmacéutico.
│   │       ├── pacientes/  # Pacientes y expedientes
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Pacientes y expedientes.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Pacientes y expedientes.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Pacientes y expedientes.
│   │       ├── planilla/  # Planilla y deducciones
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Planilla y deducciones.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Planilla y deducciones.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Planilla y deducciones.
│   │       ├── recursos-humanos/  # Recursos Humanos
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Recursos Humanos.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Recursos Humanos.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Recursos Humanos.
│   │       ├── reporte-transversal/  # Reporte transversal de administración y farmacia
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Reporte transversal de administración y farmacia.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Reporte transversal de administración y farmacia.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Reporte transversal de administración y farmacia.
│   │       ├── reportes/  # Centro de reportes
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Centro de reportes.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Centro de reportes.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Centro de reportes.
│   │       ├── reportes-citas/  # Reporte de citas
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Reporte de citas.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Reporte de citas.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Reporte de citas.
│   │       ├── reportes-ingresos/  # Reporte de ingresos
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Reporte de ingresos.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Reporte de ingresos.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Reporte de ingresos.
│   │       ├── reportes-pacientes/  # Reporte de pacientes
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Reporte de pacientes.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Reporte de pacientes.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Reporte de pacientes.
│   │       ├── reportes-personal/  # Reporte de personal
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Reporte de personal.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Reporte de personal.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Reporte de personal.
│   │       ├── seguridad/  # Usuarios, seguridad y respaldos
│   │       │   ├── index.html  # Pantalla principal o contenido HTML de la tarea: Usuarios, seguridad y respaldos.
│   │       │   ├── script.js  # Interacciones y acciones de la pantalla o tarea: Usuarios, seguridad y respaldos.
│   │       │   └── style.css  # Presentación visual de la pantalla o tarea: Usuarios, seguridad y respaldos.
│   │       ├── Admin.html  # Pantalla principal y tablero del administrador.
│   │       ├── index.html  # Redirige al tablero Admin.html del administrador.
│   │       ├── README.md  # Notas originales de la interfaz administrativa.
│   │       ├── script.js  # Interacciones y acciones de la pantalla o tarea: admin.
│   │       └── style.css  # Presentación visual de la pantalla o tarea: admin.
│   ├── bootstrap.js  # Carga sesión y datos SQLite antes del panel administrador.
│   ├── login.css  # Diseño visual compartido del inicio de sesión.
│   ├── login.html  # Pantalla de acceso y creación de la primera cuenta.
│   └── login.js  # Envía usuario y contraseña a la base de este módulo.
├── config.py  # Define el rol, el nombre de la interfaz y el puerto.
├── DOCUMENTACION_ESTRUCTURA.md  # Este árbol y la función de cada archivo.
├── ESTRUCTURA.txt  # Copia del árbol explicativo en texto plano.
├── INICIAR.bat  # Arranca el servidor y abre la dirección correcta en Windows.
├── INICIAR.sh  # Arranca el servidor en Linux o macOS.
├── LEEME_PRIMERO.txt  # Instrucciones de instalación, inicio y traslado.
├── schema.sql  # Crea las tablas y los índices de esta base SQLite.
└── server.py  # Sirve las pantallas, comprueba sesiones y guarda/consulta datos.
```

## Cómo se relacionan las partes

1. `INICIAR.bat` ejecuta `server.py` y abre la URL local del módulo.
2. `web/login.html`, `login.css` y `login.js` muestran el mismo inicio de sesión en los tres proyectos; las credenciales se comprueban en la tabla `accounts` de **esta** base.
3. Tras el acceso se abre `web/interfaces/admin/`. Sus archivos HTML presentan las tareas, CSS les da formato y JavaScript solicita o guarda información por las rutas `/api/` del servidor.
4. `server.py` guarda usuarios, pacientes y registros en `data/gimmed.sqlite`, cuyo esquema está en `schema.sql`. `data/session.key` sirve para validar la sesión.
5. Para trasladar esta web con sus datos, cierre el servidor y copie toda la carpeta, especialmente `data/`.

## Organización de tareas del administrador

Cada carpeta de `web/interfaces/admin/` corresponde a la tarea que aparece en su nombre. Dentro de cada carpeta, `index.html` presenta la pantalla, `style.css` define su aspecto y `script.js` controla sus acciones. `core/store.js` conserva el estado en SQLite; `core/crud.js` y `core/reports.js` aportan funciones comunes. `Admin.html` es el tablero principal. La página de acceso usada para entrar es `web/login.html`.

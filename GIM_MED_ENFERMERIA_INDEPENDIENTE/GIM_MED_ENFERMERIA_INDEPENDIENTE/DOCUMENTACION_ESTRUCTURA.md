# Estructura de árbol — GIM-MED Enfermería

Este archivo describe **el nombre y la función de cada carpeta y archivo** del ZIP. El árbol se genera a partir del contenido real del proyecto.

## Árbol completo

```text
GIM_MED_ENFERMERIA_INDEPENDIENTE/  # Proyecto autónomo de Enfermería.
├── data/  # Base SQLite y clave de sesiones propias de este proyecto.
│   ├── gimmed.sqlite  # Base SQLite propia: usuarios, pacientes y registros del módulo.
│   └── session.key  # Clave privada para validar las sesiones; conservar al trasladar.
├── web/  # Pantallas, estilos, lógica del navegador e imágenes.
│   ├── assets/  # Logotipo e imágenes.
│   │   └── gimmed-logo.jpeg  # Imagen del logotipo GIM-MED.
│   ├── interfaces/  # Interfaces procedentes del módulo original.
│   │   └── enfermeria/  # Código visual de Enfermería.
│   │       ├── static/  # Recursos del módulo.
│   │       │   ├── css/  # Hojas de estilos.
│   │       │   │   ├── modulos/  # Archivos separados por tarea.
│   │       │   │   │   ├── configuracion.css  # Estilos de Configuración del perfil y apariencia.
│   │       │   │   │   ├── expediente.css  # Estilos de expediente.
│   │       │   │   │   ├── hospitalizacion.css  # Estilos de Ingresos, camas, visitas, traslados y alta médica.
│   │       │   │   │   ├── inicio.css  # Estilos de Panel de inicio.
│   │       │   │   │   ├── medicamentos.css  # Estilos de Administración de medicamentos.
│   │       │   │   │   ├── notificaciones.css  # Estilos de Avisos y lectura de notificaciones.
│   │       │   │   │   ├── procedimientos.css  # Estilos de Procedimientos de enfermería.
│   │       │   │   │   ├── seguimiento.css  # Estilos de Seguimiento de pacientes.
│   │       │   │   │   └── signos.css  # Estilos de Registro de signos vitales.
│   │       │   │   └── enfermera.css  # Estilos comunes del panel de enfermería.
│   │       │   ├── img/  # Logotipo e imágenes.
│   │       │   │   ├── logo-gimmed.jpeg  # Imagen del logotipo GIM-MED.
│   │       │   │   └── nurse-profile-default.webp  # Fotografía predeterminada del perfil de enfermería.
│   │       │   └── js/  # Comportamiento del navegador.
│   │       │       ├── modulos/  # Archivos separados por tarea.
│   │       │       │   ├── configuracion.js  # Interacciones de Configuración del perfil y apariencia.
│   │       │       │   ├── expediente.js  # Interacciones de expediente.
│   │       │       │   ├── hospitalizacion.js  # Interacciones de Ingresos, camas, visitas, traslados y alta médica.
│   │       │       │   ├── inicio.js  # Interacciones de Panel de inicio.
│   │       │       │   ├── medicamentos.js  # Interacciones de Administración de medicamentos.
│   │       │       │   ├── notificaciones.js  # Interacciones de Avisos y lectura de notificaciones.
│   │       │       │   ├── procedimientos.js  # Interacciones de Procedimientos de enfermería.
│   │       │       │   ├── seguimiento.js  # Interacciones de Seguimiento de pacientes.
│   │       │       │   └── signos.js  # Interacciones de Registro de signos vitales.
│   │       │       └── common.js  # Navegación, perfil, búsqueda y guardado de formularios de enfermería.
│   │       └── index.html  # Pantalla única con las vistas HTML de las tareas de enfermería.
│   ├── login.css  # Diseño visual compartido del inicio de sesión.
│   ├── login.html  # Pantalla de acceso y creación de la primera cuenta.
│   ├── login.js  # Envía usuario y contraseña a la base de este módulo.
│   ├── registrar-medicamento.html  # Formulario auxiliar para crear existencias de enfermería.
│   └── registrar-paciente.html  # Formulario auxiliar para dar de alta pacientes en este módulo.
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
3. Tras el acceso se abre `web/interfaces/enfermeria/`. Sus archivos HTML presentan las tareas, CSS les da formato y JavaScript solicita o guarda información por las rutas `/api/` del servidor.
4. `server.py` guarda usuarios, pacientes y registros en `data/gimmed.sqlite`, cuyo esquema está en `schema.sql`. `data/session.key` sirve para validar la sesión.
5. Para trasladar esta web con sus datos, cierre el servidor y copie toda la carpeta, especialmente `data/`.

## Organización de tareas de enfermería

`web/interfaces/enfermeria/index.html` contiene las vistas HTML de las tareas de enfermería. Cada tarea tiene estilos en `static/css/modulos/` y acciones en `static/js/modulos/`, con el mismo nombre. `static/js/common.js` contiene la búsqueda de pacientes y el guardado compartido. Los formularios auxiliares para pacientes y medicamentos están en `web/`.

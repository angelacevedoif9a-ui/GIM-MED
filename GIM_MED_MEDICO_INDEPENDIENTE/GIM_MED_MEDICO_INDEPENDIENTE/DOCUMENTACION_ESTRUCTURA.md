# Estructura de árbol — GIM-MED Médico

Este archivo describe **el nombre y la función de cada carpeta y archivo** del ZIP. El árbol se genera a partir del contenido real del proyecto.

## Árbol completo

```text
GIM_MED_MEDICO_INDEPENDIENTE/  # Proyecto autónomo de Médico.
├── data/  # Base SQLite y clave de sesiones propias de este proyecto.
│   ├── gimmed.sqlite  # Base SQLite propia: usuarios, pacientes y registros del módulo.
│   └── session.key  # Clave privada para validar las sesiones; conservar al trasladar.
├── web/  # Pantallas, estilos, lógica del navegador e imágenes.
│   ├── assets/  # Logotipo e imágenes.
│   │   └── gimmed-logo.jpeg  # Imagen del logotipo GIM-MED.
│   ├── interfaces/  # Interfaces procedentes del módulo original.
│   │   └── medico/  # Código visual de Médico.
│   │       ├── static/  # Recursos del módulo.
│   │       │   ├── css/  # Hojas de estilos.
│   │       │   │   ├── base.css  # Estilos comunes del panel médico.
│   │       │   │   ├── cirugias.css  # Estilos de Registro de cirugías.
│   │       │   │   ├── configuracion.css  # Estilos de Configuración del perfil y apariencia (conservado como referencia; no cargado en el panel único).
│   │       │   │   ├── consulta.css  # Estilos de Consultas médicas.
│   │       │   │   ├── expedientes.css  # Estilos de Consulta del expediente clínico (conservado como referencia; no cargado en el panel único).
│   │       │   │   ├── inicio.css  # Estilos de Panel de inicio.
│   │       │   │   ├── mis_examenes.css  # Estilos de Consulta de resultados de exámenes.
│   │       │   │   ├── posoperatorio.css  # Estilos de Seguimiento posoperatorio.
│   │       │   │   ├── radiografias.css  # Estilos de Lecturas de radiografías.
│   │       │   │   ├── seguimiento.css  # Estilos de Seguimiento de pacientes.
│   │       │   │   └── solicitar_examenes.css  # Estilos de Solicitudes de exámenes.
│   │       │   ├── img/  # Logotipo e imágenes.
│   │       │   │   └── logo-gimmed.jpeg  # Imagen del logotipo GIM-MED.
│   │       │   ├── js/  # Comportamiento del navegador.
│   │       │   │   ├── base.js  # Búsqueda de pacientes, formularios, borradores y avisos médicos.
│   │       │   │   ├── cirugias.js  # Interacciones de Registro de cirugías.
│   │       │   │   ├── configuracion.js  # Interacciones de Configuración del perfil y apariencia (conservado como referencia; no cargado en el panel único).
│   │       │   │   ├── consulta.js  # Interacciones de Consultas médicas.
│   │       │   │   ├── expedientes-autonomo.js  # Búsqueda e historia médica del portal independiente.
│   │       │   │   ├── expedientes.js  # Interacciones de Consulta del expediente clínico (conservado como referencia; no cargado en el panel único).
│   │       │   │   ├── inicio.js  # Interacciones de Panel de inicio.
│   │       │   │   ├── mis_examenes.js  # Interacciones de Consulta de resultados de exámenes.
│   │       │   │   ├── posoperatorio.js  # Interacciones de Seguimiento posoperatorio.
│   │       │   │   ├── radiografias.js  # Interacciones de Lecturas de radiografías.
│   │       │   │   ├── seguimiento.js  # Interacciones de Seguimiento de pacientes.
│   │       │   │   └── solicitar_examenes.js  # Interacciones de Solicitudes de exámenes.
│   │       │   └── uploads/  # Directorio reservado del código original.
│   │       │       └── .gitkeep  # Marcador sin función de ejecución del proyecto original.
│   │       └── index.html  # Pantalla única con las vistas HTML de las tareas de médico.
│   ├── login.css  # Diseño visual compartido del inicio de sesión.
│   ├── login.html  # Pantalla de acceso y creación de la primera cuenta.
│   ├── login.js  # Envía usuario y contraseña a la base de este módulo.
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
3. Tras el acceso se abre `web/interfaces/medico/`. Sus archivos HTML presentan las tareas, CSS les da formato y JavaScript solicita o guarda información por las rutas `/api/` del servidor.
4. `server.py` guarda usuarios, pacientes y registros en `data/gimmed.sqlite`, cuyo esquema está en `schema.sql`. `data/session.key` sirve para validar la sesión.
5. Para trasladar esta web con sus datos, cierre el servidor y copie toda la carpeta, especialmente `data/`.

## Organización de tareas del médico

`web/interfaces/medico/index.html` contiene las vistas HTML de las tareas médicas. Los estilos y programas JavaScript de cada tarea están separados por nombre en `static/css/` y `static/js/`. `expedientes-autonomo.js` conecta la historia clínica con esta web independiente. Los archivos originales `configuracion.css`, `configuracion.js`, `expedientes.css` y `expedientes.js` se conservan para consulta, pero esta pantalla única no los carga; la ruta para cambiar la contraseña está en `server.py`, pero no hay un formulario de configuración conectado en esta pantalla.

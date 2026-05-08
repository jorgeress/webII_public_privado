Informe de Examen — BildyApp API
1. Reto
   
El objetivo principal ha sido securizar la API de BildyApp, garantizando que el aislamiento de datos por compañía sea infranqueable (Multi-tenancy) y que la gestión de archivos y permisos de usuario sigan las mejores prácticas de seguridad (OWASP).

2. Tarea Técnica
   
Se han implementado las siguientes mejoras de seguridad y control:

Allowlist en Updates: Tanto en updateClient como en updateProject, se ha sustituido el uso directo de req.body por una desestructuración explícita de campos permitidos para evitar ataques de Mass Assignment.

Seguridad de Archivos: Implementación de un imageFilter en Multer que bloquea explícitamente el tipo MIME image/svg+xml, previniendo ataques de inyección XML (XXE) y XSS.

Control de Acceso: Refuerzo de la lógica de autorización en la firma de albaranes, asegurando que un usuario con rol guest solo pueda interactuar con sus propios recursos.

3. Respuestas Socráticas


#1. Aislamiento y Role Middleware
Pregunta: ¿Debería el role middleware proteger el endpoint de obtención de albaranes? ¿Por qué no está en las rutas?

Respuesta: No, el middleware de rol no debe proteger de forma genérica el endpoint de obtención de albaranes en las rutas porque tanto el rol admin como el guest necesitan acceso a esta entidad para el funcionamiento normal de la aplicación.

La seguridad no se basa solo en el rol (RBAC), sino en una combinación de Multi-tenancy y Autorización Lógica:

Aislamiento de datos: El acceso a los albaranes se filtra en el controlador mediante el companyId del usuario autenticado, garantizando que nadie vea datos de otras empresas.

Autorización granular (La mejora): En acciones críticas como la firma (PATCH /:id/sign), se ha implementado una verificación de propiedad en el controlador. Mientras que el admin puede firmar cualquier albarán de su empresa, el guest solo puede firmar aquellos que él mismo ha creado (isOwner).

Si hubiéramos puesto el middleware de rol en la ruta, habríamos bloqueado funciones legítimas para el guest o permitido que un guest firme albaranes de sus compañeros injustificadamente. Al gestionarlo en el controlador, logramos un control de acceso mucho más preciso y seguro.

#2. Zod y la Inyección de Campos
   
Pregunta: Si llega { "company": "otro-id" } en un update, ¿Zod lo rechazaría?

Respuesta: Por defecto, Zod ignora los campos no definidos a menos que se use .strict(). Sin embargo, en mi implementación de updateClient, realizo una desestructuración manual (const { name, cif... } = req.body). Esto actúa como una Allowlist efectiva: aunque el atacante inyecte el campo company, este nunca se extrae ni se pasa al método $set de Mongoose, neutralizando el ataque.

#3. Vulnerabilidad SVG en Sharp
   
Pregunta: ¿Es vulnerable el servicio si se suben SVGs?

Respuesta: Sí. Los archivos SVG son XML y pueden contener scripts maliciosos (XSS) o entidades externas (XXE). Aunque Sharp intente procesarlo, el riesgo está en el parseo inicial. He resuelto esto en src/middleware/upload.ts definiendo una ALLOWED_IMAGE_MIMES que excluye explícitamente image/svg+xml, permitiendo solo formatos de mapa de bits (JPEG, PNG, WebP, GIF).

#4. Lógica de UpsertCompany y Autónomos
   
Pregunta: Si un autónomo llama dos veces a upsertCompany, ¿qué ocurre?

Respuesta: Existe un fallo de lógica. La primera vez crea la empresa y el usuario es admin. La segunda vez, Company.findOne encuentra el CIF existente y el código entra en el else, asignando user.role = 'guest'. Resultado: El dueño de la empresa se degrada a sí mismo a invitado. Corrección: Se debe validar si el usuario actual ya es el owner de esa compañía antes de cambiar el rol.

#5. Buenas Prácticas en CI/CD (GitHub Secrets)
   
Pregunta: ¿Es buena práctica hardcodear secretos en el YAML? ¿Cómo se configura?

Respuesta: Es una práctica insegura, ya que el secreto queda en el historial de Git. La forma correcta es usar GitHub Secrets. Se deben configurar en Settings -> Secrets and variables -> Actions del repositorio y referenciarlos en el YAML mediante la sintaxis ${{ secrets.JWT_ACCESS_SECRET }}. El archivo proporcionado ya sigue esta estructura recomendada.

4. Proceso de Desarrollo
   
Auditoría: Revisión de controladores para detectar el uso de req.body sin filtrar.

Refactorización: Aplicación de desestructuración en los métodos update de clientes y proyectos.

Seguridad de Capa Media: Creación del middleware de filtrado de imágenes para restringir formatos vectoriales peligrosos.

Testing: Creación de un caso de prueba (Jest/Supertest) para verificar que un usuario guest recibe un 403 Forbidden al intentar firmar un albarán que no le pertenece, incluso si es de su misma compañía.

Documentación: Registro de hallazgos y soluciones en este documento.

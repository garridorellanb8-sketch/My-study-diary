# Spec 001 — Mapa de calor de sesiones de estudio

**Contexto y objetivo**
El Diario de Estudio registra sesiones de estudio diarias. Se solicita agregar una vista de mapa de calor que muestre visualmente los días estudiados en las últimas 2 semanas, donde la intensidad del color indique cuántos minutos se estudió cada día. Esta vista ayudará a los usuarios a motivarse al ver su patrón de estudio a simple vista, al estilo GitHub.

**Usuarios**
- **estudiante**: persona que usa el diario para registrar sesiones y motivarse viendo su progreso visual. Usa la aplicación diariamente o varias veces por semana.

**Historias de usuario**
- Como estudiante, quiero ver un mapa de calor de mis sesiones de las últimas 2 semanas para entender mis patrones de estudio.
- Como estudiante, quiero que los días sin sesiones se vean diferentes (en gris) para completar el patrón semanal.
- Como estudiante, quiero que el color de cada día refleje la intensidad de minutos estudiados, con un límite máximo.

**Requisitos funcionales (notación EARS en español)**

**RF-1**: El mapa de calor mostrará un grid de 14 columnas (días) × N filas (semanas completas o parciales), cubriendo exactamente las últimas 2 semanas desde hoy, incluyendo días anteriores sin sesión (mostrados en estado gris/desactivado).

**CF-1** [Cuando el usuario abre la vista de mapa de calor]: **entonces** el grid debe tener exactamente 14 columnas representing the 14 días más recientes, desde hoy hacia atrás, cubriendo dos semanas completas.

**RF-2**: Cada día del grid mostrará un indicador visual con un nivel de intensidad de color basado en los minutos totales estudiados en ese día, calculado desde los registros en localStorage clave `diario-estudio`.

**CF-2** [Cuando un día tiene sesiones registradas]: **entonces** el color de ese día debe ser más intenso proporcionalmente a los minutos acumulados, con un techo máximo de intensidad definido.

**CF-3** [Cuando un día tiene múltiples sesiones]: **entonces** los minutos se suman para determinar la intensidad del color de ese día.

**CF-4** [Cuando un día no tiene sesiones]: **entonces** el día se mostrará en estado gris/desactivado (sin intensidad de color).

**RF-3**: El esquema de colores usará un gradiente de un color claro a uno más oscuro, donde:
- **0 minutos** = estado gris/desactivado (día sin sesiones)
- **Mínimo definido** (ej. 1-15 minutos) = color base/incipiente
- **Máximo definido** (ej. 60+ minutos) = color completamente saturado

**CF-5** [Cuando los minutos de un día exceden el máximo definido]: **entonces** el día se mostrará con el color de máximo intensidad (saturado), sin aumentar más allá.

**RF-4**: Los datos del mapa de calor se obtendrán exclusivamente de localStorage con clave `diario-estudio`, considerando solo sesiones passadas y presentes (no futuras), y agruparán automáticamente los minutos por fecha de sesión.

**CF-6** [Cuando hay sesiones futuras en los datos]: **entonces** deben ignorarse y no contar para el mapa de calor, respetando la regla de "fechas futuras no suman".

**Requisitos no funcionales**
- **Simplicidad**: Implementación compatible con la regla de "HTML, CSS y JS puros. Sin dependencias ni build. Funciona abriendo index.html con doble clic".
- **Local storage**: Lectura de `localStorage.getItem('diario-estudio')` con compatibilidad hacia atrás (manejo de arrays y fechas).
- **Hora local**: Todas las fechas y cálculos deben respetar la hora local del usuario, nunca usar `toISOString()` ni `new Date("AAAA-MM-DD")` que interpreten en UTC.
- **Sin modificaciones de datos**: El mapa de calor solo leerá datos, no modificará el arreglo de sesiones ni el localStorage.

**Casos límite**
- **Día sin sesiones alguna en las 2 semanas**: El grid mostrará 14 columnas, todas en estado gris.
- **Múltiples sesiones mismo día**: Los minutos se suman y el día toma la intensidad total combinada.
- **Sesiones exactly en el límite de 2 semanas**: Días exactamente hace 14 días se incluyen; días hace 15 días se excluyen.
- **Usuario nuevo sin datos previos**: El grid de 14 columnas aparece pero todo en estado gris/desactivado.
- **Un solo día de sesiones en las 2 semanas**: Un día con color intenso, los demás en gris.

**Fuera de alcance (para esta versión)**
- Selector de rango de semanas personalizado (solo "últimas 2 semanas" fijo).
- Guardar o persistir la configuración del mapa de calor.
- Exportar el mapa de calor como imagen o PDF.
- Mapa de calor para rangos de tiempo diferentes a 2 semanas (mes, 3 meses, etc.).
- Interactividad en los días del mapa (click para ver detalles, tooltip con fecha exacta).
- Animaciones o transiciones complejas en el cambio de semana.
- Integración con modo oscuro/claro automático (aunque el color esquema debe ser compatible).

**Criterios de finalización**
- [ ] Se puede ver un grid de 14 columnas (2 semanas) al acceder a la vista de mapa de calor.
- [ ] Los días con sesiones registradas muestran color según intensidad de minutos.
- [ ] Los días sin sesiones en las 2 semanas aparecen en estado gris/desactivado.
- [ ] Múltiples sesiones en un mismo día se suman para el cálculo de intensidad.
- [ ] Sesiones futuras son ignoradas (no cuentan para el mapa).
- [ ] La lógica de cálculo es una función pura que recibe "hoy" como parámetro y retorna la matrix de datos (sin dependencia DOM).
- [ ] El esquema de colores usa un gradiente documentado de claro a oscuro.
- [ ] Pruebas unitarias con `node --test` pasan para los casos de cálculo básicos.

**Dudas abiertas [NECESITA ACLARACIÓN]**
- ¿Cuál es el número exacto de minutos que define el "máximo" y el "mínimo" del gradiente de color? (Ej: 15 min = color base, 60 min = saturado). *Esto definirá la escala visual pero puede ajustarse después.*
- ¿El grid debe mostrar semanas completas llenas o puede tener una fila parcial al inicio/fin para completar exactly 14 días? *Definir si la primera/última fila puede tener menos de 7 celdas.*
- ¿Qué estilo CSS exacto aplicar para los estados gris/desactivado vs. colores de intensidad? *La lógica de datos retorna valores; el CSS queda definido en la integración.*

---

**El QUÉ y el POR QUÉ**: Esta funcionalidad satisface la necesidad de motivación visual del usuario al ver sus patrones de estudio a largo plazo, al estilo de las "streaks" pero gráfico. Se alinea con el principio de "Lógica separada de interfaz" de la constitución: la función pura de cálculo recibirá `hoy` y los datos de localStorage, retornando una matrix estructurada, dejando la renderización CSS a cargo de quien integre la funcionalidad. Nada de frameworks, build steps ni dependencias: puro HTML/CSS/JS que funcione abriendo `index.html` con doble clic, tal como establece el principio de simplicidad primera.
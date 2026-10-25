# FinGrow · Landing

Sitio público de FinGrow: presenta la plataforma a empresas y empleados y lleva al login de la app
(FinGrow-FE). Es estático: Vite + TypeScript sin framework, con GSAP (ScrollTrigger y SplitText)
para lo que depende del scroll, Motion para las microinteracciones con resortes, three.js para la
portada y Lenis para el scroll suave.

## Comandos

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # typecheck + build en dist/
npm run preview
npm run screens    # convierte public/screens/*.png a WebP
```

## Variables

| Variable | Para qué | Default |
|---|---|---|
| `VITE_APP_URL` | Adónde llevan "Ingresar" y "Ya tengo cuenta" (la portada de FinGrow-FE) | `http://localhost:3000` |
| `VITE_CONTACT_EMAIL` | Mail del botón "Escribinos" | `contacto@fingrow.com.ar` |

Se fijan al buildear (`.env.local` en local, build args en Docker).

## Estructura

```
index.html              Todo el contenido y los textos de la landing
src/main.ts             Arranque: estilos, scroll suave y cada sección
src/motion.ts           GSAP, ScrollTrigger, SplitText y Lenis
src/scene/leaf-field.ts Partículas de three.js que forman las cuatro hojas del logo
src/sections/           Animación de cada sección (portada, demo del chat, funciones, salud...)
src/styles/             Tokens de diseño, base y estilos por sección
public/screens/         Capturas reales de la plataforma en WebP
scripts/                Conversión de capturas
```

## Secciones

1. **Portada**: partículas que pasan de una nube desordenada a las hojas del logo y, al scrollear,
   a un gráfico de barras que crece.
2. **Panel**: captura del resumen del empleado que se endereza en 3D con el scroll, con tarjetas
   flotantes.
3. **Canales**: cinta infinita que acelera con la velocidad del scroll.
4. **Cómo se usa**: animación en HTML de un chat con el bot (texto, audio y foto de ticket) que
   manda cada gasto a la bandeja de pendientes, donde se confirma y mueve el presupuesto.
5. **Funciones**: tour guiado. En desktop la sección queda fija y las seis pantallas forman un mazo
   en 3D que se reparte con el scroll; en cada una, un foco ilumina la parte clave con una etiqueta,
   y al costado hay capítulos con barra de progreso (clickeables) y un número gigante que rueda. En
   mobile es un carrusel que se desliza de a una pantalla.
6. **Salud financiera**: medidor de 0 a 100 con las bandas y los pesos reales del puntaje
   (ahorro 40 %, presupuestos 25 %, metas 20 %, colchón 15 %).
7. **Empresa**, **Cómo empezar**, **Privacidad**, **Preguntas** y **Contacto**.

`src/sections/springs.ts` usa Motion (motion.dev) para las microinteracciones: los botones suben
2 px con un reflejo de luz y se hunden al apretarlos, las capturas se inclinan con un brillo que sigue
al puntero, la aguja del medidor tiene inercia y el logo se abre al pasar el mouse. En pantallas
táctiles solo queda el efecto de apretar los botones.

Todo respeta `prefers-reduced-motion`: sin scroll suave, sin resortes, con el logo ya armado y las
animaciones en su estado final.

## Capturas

Las capturas salen de la plataforma corriendo en local con los datos demo de Luxcar
(`seed-luxcar-demo.sql`), con un empleado ficticio. Para renovarlas: dejar los PNG en
`public/screens/` con el mismo nombre y correr `npm run screens`; los originales quedan en
`screens-raw/`, que no se versiona.

## Deploy

```bash
docker build -t fingrow-landing --build-arg VITE_APP_URL=https://<dominio-de-la-app> .
docker run -p 8080:80 fingrow-landing
```

La imagen sirve `dist/` con nginx.

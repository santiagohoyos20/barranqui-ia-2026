# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Frontend Comercial

  Este frontend muestra un dashboard comercial para Banco Serfinanza centrado en leads, interés por producto, citas agendadas, fricción del embudo y rendimiento del asistente.

  ## Correr en local

  ```bash
  cd frontend
  npm install
  npm run dev
  ```

  ## Build de producción

  ```bash
  cd frontend
  npm run build
  npm run preview
  ```

  ## Variables de entorno

  - `VITE_USE_MOCK_DATA`: deja el dashboard usando datos de ejemplo. Por defecto está activo.
  - `VITE_SUPABASE_URL`: URL del REST de Supabase para leer tablas desde el navegador.
  - `VITE_SUPABASE_ANON_KEY`: clave pública de Supabase para acceder al REST.
  - `VITE_SUPABASE_SCHEMA`: normalmente `public`.
  - `VITE_API_URL`: URL del servicio del chat.

  Si el backend comercial todavía no existe, la interfaz seguirá funcionando con datos mock para que el diseño y la navegación se puedan revisar desde ya. El navegador no debe usar la cadena `postgresql://...`; para el front se necesita la URL REST y la clave pública `anon`.


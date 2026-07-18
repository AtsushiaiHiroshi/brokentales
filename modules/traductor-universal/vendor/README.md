# Librerías opcionales

Coloca aquí `tesseract.min.js` si quieres activar el OCR local para imágenes y handouts.

Ruta esperada:

```txt
modules/traductor-universal/vendor/tesseract.min.js
```

El módulo no incluye Tesseract por defecto para evitar aumentar el tamaño del paquete. Si el archivo no existe, el ajuste de OCR no rompe Foundry; simplemente no procesa imágenes.

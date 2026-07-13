# Broken Tales - Investigacion de reglas para Foundry

Este documento resume elementos corroborados en fuentes publicas para orientar la implementacion del sistema local. La edicion espanola de Devir que posee la mesa debe tener prioridad cuando exista una discrepancia terminologica o de detalle.

## Fuentes usadas

- Monad Echo SRD: https://mesrd.opengamingnetwork.com/
- Manual basico local en espanol: `C:\Users\Gamer\Documents\Broken Tales KS [ENG]\Extras\Broken Tales - Manual Basico.pdf`
- Hojas de Cazador locales en espanol: `C:\Users\Gamer\Documents\Broken Tales KS [ENG]\Extras\Broken Tales - Hojas de Cazador.pdf`
- Corebook local en ingles: `C:\Users\Gamer\Documents\Broken Tales KS [ENG]\bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf`
- Devir Chile, Broken Tales Las Hojas de Cazador: https://devir.cl/broken-tales-las-hojas-de-cazador
- PDF gratuito de hojas de personaje Devir: https://devirinvestments.s3.eu-west-1.amazonaws.com/PDFs/PDFs%20Gratis/BrokenTales_HojasPersonaje.pdf
- The World Anvil, diario de diseno de Cazador personalizado: https://theworldanvil.com/en/blogs/news/broken-tales-diario-di-design-creare-un-cacciatore-personalizzato
- Bundle of Holding, ficha editorial del bundle Broken Tales: https://bundleofholding.com/presents/BrokenTales

## Terminologia

El manual basico local en espanol define "Prueba de posicion", "Prueba de defensa" y "Nivel de Oposicion" en la pagina 12. Las Hojas de Cazador locales repiten esta misma terminologia en las paginas 2 y 3. Por fidelidad a la fuente primaria, la interfaz debe usar:

- Prueba de posicion.
- Prueba de Defensa.
- Nivel de Oposicion, abreviado NO.
- Cazador.
- Descriptor.
- Don.
- Ego oscuro.
- Soma.
- Heridas.
- PX.
- Escena.
- Interludio.
- Intercambio.

## Ciclo basico de resolucion

1. El Narrador decide si la ficcion requiere prueba.
2. Si el Cazador inicia una accion frente a peligro u oposicion, se hace Prueba de posicion.
3. Si una amenaza, PNJ o circunstancia actua contra el Cazador, se hace Prueba de Defensa.
4. El Narrador fija el NO base.
5. El NO puede ajustarse normalmente en -1, 0 o +1 por posicion narrativa, Descriptores relevantes o Descriptores de la amenaza.
6. El jugador determina si un Descriptor ayuda.
7. Si hay Descriptor relevante, el Cazador parte de 3 exitos basicos; si no, parte de 1 exito basico. Confirmado en Manual Basico p. 15 y Hojas de Cazador p. 2.
8. Si puso un Descriptor en juego, puede gastar Soma para sumar exitos adicionales.
9. Puede arriesgar dados d6.
10. Cada d6 con 2-6 aporta 1 exito adicional.
11. Si cualquier dado de riesgo muestra 1, la prueba falla automaticamente.
12. Resultado, confirmado en Manual Basico p. 16 y Hojas de Cazador p. 3:
    - exitos < NO: fallo.
    - exitos = NO: triunfo con coste.
    - exitos = NO + 1: triunfo estandar.
    - exitos >= NO + 2: triunfo con incremento.

## Niveles de oposicion

La referencia publica de Devir resume tres niveles:

- Facil: 3 exitos.
- Intermedio: 5 exitos.
- Dificil: 7 exitos.

Para Foundry conviene permitir:

- selector rapido 3/5/7;
- campo numerico libre para PNJ especiales, amenazas o reglas de expansion;
- modificador narrativo separado, visible en la chat card.

## Cazador

La hoja oficial gratuita sugiere estos campos minimos:

- Jugador.
- Cazador.
- Descripcion.
- Tres Descriptores principales.
- Dones vinculados a los Descriptores.
- Ego oscuro.
- Activador.
- Descriptores y dones adicionales.
- Dones de escenario.
- Equipo, con tres lineas principales.
- Heridas.
- Herida adicional.
- Soma.
- PX.
- Notas.
- Punto de libro.

Implicacion para Foundry:

- Actor type principal: `hunter`.
- Los Descriptores y Dones deben ser Items arrastrables.
- La hoja debe destacar Descriptores y Dones por encima del equipo.
- Soma, Heridas y PX deben ser controles visibles en primera pantalla.
- Ego oscuro puede ser un Item tipo `gift` con categoria `darkEgo`, o un bloque especial del Cazador.

## Descriptores

El Manual Basico p. 30-31 y las Hojas de Cazador p. 2 indican que un Cazador se construye alrededor de tres Descriptores completos, cada uno con parte positiva y negativa. Esos tres Descriptores responden:

- Quien es y que hace en la Orden.
- Cual es su recurso, rasgo o capacidad mas distintiva.
- Que vinculo conserva con su identidad original de cuento.

Cada Descriptor debe tener:

- parte positiva;
- parte negativa;
- relacion con palabras clave o conceptos del personaje;
- posibilidad de marcar PX si su lado negativo complica la escena.
- posibilidad de convertirse en especializacion durante un interludio gastando PX.

Implicacion para Foundry:

- Item type `descriptor`.
- Campos: `positive`, `negative`, `xpMarked`, `isAdditional`, `linkedGift`, `notes`.
- En tirada, seleccionar al menos un Descriptor relevante activa 3 exitos basicos.
- Si ningun Descriptor es relevante, la prueba parte de 1 exito basico.
- La especializacion otorga 1 exito adicional la primera vez que se utiliza en cada escena.

## Dones

El SRD define los Dones como habilidades especiales con efectos particulares. En Broken Tales, los Dones son uno de los pilares de la identidad del Cazador.

Campos utiles para Foundry:

- nombre;
- descripcion;
- disparador o condicion de activacion;
- coste de Soma;
- exitos automaticos o ventaja;
- usos por Escena/Interludio, si aplica;
- categoria: normal, ego oscuro, escenario, PNJ/amenaza;
- mejora o evolucion, si se usa con PX.

El pool de Soma suele depender del conjunto de Dones, asi que el sistema no debe asumir que todos los Cazadores empiezan con el mismo maximo.

## Soma

Soma representa fuerza interior/reserva de voluntad. Se gasta para obtener exitos automaticos en pruebas y puede activar Dones.

Reglas tecnicas:

- 1 Soma = 1 exito adicional, cuando la regla permita gastarlo.
- El gasto debe mostrarse en chat.
- El gasto debe descontarse del Actor.
- La UI debe impedir gastar mas Soma del disponible.
- El maximo de Soma deberia ser editable, y mas adelante calculable desde Dones si confirmamos formula exacta de Broken Tales.

## Heridas

Las Heridas representan resistencia a dano, trauma o adversidad. Manual Basico p. 32-33 y Hojas de Cazador p. 3 indican que cada Herida debe describirse y anotarse en el punto de libro, afectando narrativamente a lo que el Cazador puede hacer y al NO al que se enfrenta.

Campos utiles:

- nombre o descripcion breve;
- tipo narrativo: fisica, mental, fatiga, maldicion, otro;
- recuperable;
- escena en la que se recibio, opcional;
- notas de recuperacion;
- si ocupa la Herida adicional.

Reglas relevantes:

- Un Cazador suele tener tres espacios de Herida.
- Puede existir Herida adicional.
- Una Herida funciona como Descriptor negativo temporal.
- Al sufrir una Herida, el Cazador puede activar su Ego oscuro durante la escena.
- El jugador puede autoinfligirse una Herida para activar inmediatamente el Ego oscuro.

## PNJ y Amenazas

La hoja de resumen de escenario de Devir muestra PNJ con:

- nombre;
- NO;
- Heridas;
- Descriptor;
- Objetivo;
- Dones.

Tambien muestra Lugares con:

- nombre;
- Descriptor;
- Don;
- otros datos.

El SRD distingue:

- PNJ principal: agenda, descriptor, heridas, NO, dones.
- PNJ menor: normalmente pocas heridas, a menudo sin dones.
- Amenaza: descriptor, NO y Don opcional.

Implicacion para Foundry:

- Actor type `threat` para PNJ y amenazas complejas.
- Actor type `essence` para espiritus, esencias, almas, virtudes o entidades incorporeas que no funcionen como PNJ fisicos.
- Item type `storyElement` para lugares, pistas, escena o elementos de escenario.
- Campos de amenaza: `oppositionLevel`, `wounds`, `descriptor`, `objective`, `agenda`, `gifts`.

## Escenarios

La hoja oficial de resumen incluye:

- Cuento roto.
- Palabras clave de seguridad.
- Palabras clave.
- La historia hasta ahora.
- Contexto.
- La historia cuando llegan los Cazadores.
- Acontecimientos y notas.
- Dones de escenario.
- PNJ.
- Lugares.
- Mapa de Europa Rota.

Implicacion para Foundry:

- A medio plazo conviene crear una App o Journal template para "Resumen de escenario".
- No hace falta copiar escenarios oficiales; basta con estructura editable.

## Equipo

El equipo en Monad Echo tiene peso narrativo mas que estadistico. La hoja oficial deja tres lineas principales.

Implicacion para Foundry:

- Item type `equipment`.
- Campos ligeros: cantidad, descripcion, usos, notas.
- Evitar listas de armas con dano fijo salvo regla especifica del manual.
- Equipo excepcional podria modelarse como Don si tiene efecto mecanico claro.

## Tiempo de juego

Elementos a modelar:

- Escena.
- Interludio.
- Intercambio.

Implicacion para Foundry:

- Fase inicial: notas manuales en chat/Journals.
- Fase posterior: tracker simple de Escena/Interludio y contador de Intercambios para conflictos.

## Expansion The Broken Ones

Fuentes publicas describen:

- 13 hojas de Cazador adicionales.
- modo solitario;
- The Village, modo con humanos fragiles de tono OSR;
- Tesoro de la Orden;
- siete escenarios adicionales.

Implicacion para Foundry:

- No bloquear el sistema a solo Cazadores del basico.
- Preparar `hunter` con categorias o etiquetas.
- Si se implementa The Village, podria requerir Actor type separado como `villager` o una variante de Cazador con mortalidad distinta.

## Pendiente de confirmar con manual Devir

- Formula exacta de Soma inicial/maximo en Broken Tales, no solo Monad Echo generico.
- Numero y relacion exacta de Dones iniciales, Ego oscuro y Activador.
- Reglas de recuperacion de Soma.
- Si la Herida adicional se habilita por regla general, Don, Cazador concreto o condicion especial.
- Efectos concretos de Dones oficiales, que no deben copiarse al sistema publico sin permiso.

# Mi diario de estudio
## que es?
##### Es una aplicacion para motivar a los estudiantes de informatica a seguir estudiando con rachas y objetivos.

## funciones
*Tiene un botton para cambiar los colores de la applicacion por ejemplo cuando le tocas al sol se pone toda de color blanco y amarillo y colores claro y cundo tocas la luna todo el contrario.
#    
* Tiene una seccíon con 3 marcadores uno muestra cuantas "rachas llevas actualmente", uno lleva cual "fue tu record de rachas" y uno muestra cuantas "rachas llevas este mes".
#      
* Tiene una seccíon para crear una "session" donde te pide introduccir la "Fecha", "que estudiaste" y "cuanto tiempo estudiaste en (min)".
#      
* Despues de que introduccieras el ultimo paso, tienes opcionalmente la seccion "apuntes" donde puedes apuntar cosas que fueron importantes o simplemente no quieres olvidar de lo que aprendiste.
#     
* Despues tienes la seccíon de "sessiones" donde puedes editar o borrar sessiones creadas con las ultimas 2 seccíones.
#   
* Debajo de la seccíon "sessiones" tienes la seccíon de "objetivos semanales" donde te puedes fijar un objetivo para 2 semanas y intentar cumplirla como motivacion.
#  
* Debajo de objetivo de sessiones tenemos el mapa de calor de cuanto vas estudiando cada 2 semanas

## Porque lo he hecho?
### Este proyecto realmente es mi proyecto final del curso de "Desarollo con IA el nuevo programador" de "Brais Mouredev" esto es el enlaze del primer dia:https://www.youtube.com/live/qHYi92zRn-s  .
#
### Y si, lo he hecho con IA, pero he aprendido un monton de cosas muy interesantes y que para desarollar una aplicacion son muy utiles porque no te enseñan a poder decirle a la IA que tiene que hacer de forma controlada y responsable y lo mas importante "sabiendo lo que hace en todo momento" .
#
## Como lo he hecho?
1. he seguido el curso y he hecho uso de los apuntes que nos mandaba con los prompts y como se hace todo y mientras tanto miraba tambien el video para saber hacerlo practicamente.
2. El curso empezo en que nos explicaba que es importante para ser Desarollador y que el sector ha cambiado y que nos tenemos que adaptar con la llegada de la IA en 2023.
3. despues nos fue explicando palabras importantes que teniamos que saber como por ejemplo LLMs.
4. a continuacion nos enseño las mejores Herramientas para hacer el curso y como el escogio opencode y cursor decidi descargar tambien opencode y despues use VS code como editor.
5. desde que tenía las herramientas empezo explicandonos como hacer un prompt classico con Rol-->contexto-->Tarea exacta--->Ressricciones o reglas--->formato de salida.
6. despues lanzamos el primer prompt classico para crear una primera version de la aplicacion para poder ír desarollando la aplicacion con los agentes pero tambien usamos la aplicacion para desarollar a los agentes.
7. despues nos dijo que siempre se escriben los prompts en Formato Markdown a no ser que sea una decision corta pequeña o dudas o lo que sea pero no muy importante.
8. Despues creamos el AGENTS.md donde por así decir encarrilamos el agente a como queremos exactamente como trabaje cubriendo ciertas preguntas como-->flujo de trabajo o prohibiciones etc.. .
9. Despues nos explico que es /init en opencode y que servia para hacer al Agente hacer el AGENTS.md pero yo personalmente pienso que no tiene mucho sentido porque al final somos nosotros que tenemos que controlarlo y bueno yo lo haria solo y no se lo dejaria hacer a el.
10. Despues nos explico que es un MEMORY.md --> es un fichero para que el Agente que lo lea la proxima vez pueda saber como seguir y en que estado esta la aplicacion --> es como una memoria fija corto para que sepan como seguir la proxima vez, como una documentacion.
11. Despues nos explico cuando usar el modo plan o build en opencode---> que uno es para planificar algo y el otro es para implementar.
12. Tambien nos explico cuando usar uno o el otro en que caso.
13. Despues en el segundo día nos explico que so commandos y skills cuales eran las diferencias y como crearlas--> commandos es como un atajo para el usuario y skills son como dice el nombre skills que son como commandos pero que puede hacer uso el agente sin falta de que el usuario los tenga que lanzar en el chat.
14. Despues nos fue enseñando como descargar skills oficiales de paginas oficiales para no tener porque hacerlas a mano siempre.
15. Despues nos explico que son Mcps y como incorporarlos en el proyecto como por ejemplo Chrome-deevtools que lo usamos mas que nada para revisar el proyecto si funcionaba bien y tambien nos recommento context-7 y nos explico que es un mcp para que el agente tenga la informacion ma actualizada posible.
16. despues nos fuimos metiendo en el spec-driven-developement (sdd) que es un flujo de trabajo mui complejo para desarollar con una buena planificacion-->despues revision-->despues imlementacion---depues otra vez revision-->y despues ya está.
17. y despues lo implementamos en el proyecto y creamos una skill que describa todo el flujo de sdd para que el agente lo pueda usar cada vez que se necesite.
18. al final nos dio como ejercicio crear cada pieza de sdd en un commando y pues lo hice.
19. El tercer dia fue el mejor de todos y el mas interessante porque literalmente automatizamos moto lo que teniamos hecho con Agentes y Subagentes.
20. empezo explicandonos la differencia entre Agente y Subagente--> el Agente es con el que hablas en el chat de opencode y el subagente es el que trabaja detras del escenario mientras el Agente habla contigo.
21. despues creamos nuestro grupo de agentes y subagentes que se veia así:
    Coordinator (Agente) da instrucciones a
        ↓
Planner (el que planifica el plan)
        ↓
Implementer (el encargado de implementar el plan)
        ↓
Reviewer (revisor encargado de revisar todo)
.
22.Y hicimos la descripcion de que tiene que hacer cada uno para que funcione.
23.al final del video nos presentaba su master de desarollo con IA.
24.Y acabo el curso.
# Certificacion
Certificado-Brian-Garrido-Rellan-pzt5tubv.pdf (esta en los archivos del repositorio de segundo)


# Deutsche version
# Mein Lerntagebuch

## Was ist es?

##### Es ist eine Anwendung, um Informatikschüler zu motivieren, weiterzulernen, mit Lernserien und Zielen.

## Funktionen

*Sie hat einen Button, um die Farben der Anwendung zu ändern. Wenn man zum Beispiel auf die Sonne klickt, wird die ganze Anwendung weiß, gelb und allgemein in hellen Farben dargestellt, und wenn man auf den Mond klickt, ist es genau das Gegenteil.

#

* Sie hat einen Bereich mit 3 Markierungen. Eine zeigt, wie viele „Streaks du aktuell hast“, eine zeigt, was dein „Streak-Rekord“ war, und eine zeigt, wie viele „Streaks du diesen Monat hast“.

#

* Sie hat einen Bereich zum Erstellen einer „Session“, in dem man „Datum“, „was du gelernt hast“ und „wie lange du gelernt hast (in Min.)“ eingeben muss.

#

* Nachdem du den letzten Schritt eingegeben hast, gibt es optional den Bereich „Notizen“, in dem du wichtige Dinge aufschreiben kannst oder einfach Dinge, die du von dem Gelernten nicht vergessen möchtest.

#

* Danach gibt es den Bereich „Sessions“, in dem du die Sessions, die du mit den letzten 2 Bereichen erstellt hast, bearbeiten oder löschen kannst.

#

* Unter dem Bereich „Sessions“ gibt es den Bereich „Wochenziele“, in dem du dir ein Ziel für 2 Wochen setzen und versuchen kannst, es als Motivation zu erreichen.

#

* Unter den Session-Zielen gibt es die Heatmap, die zeigt, wie viel du alle 2 Wochen lernst.

## Warum habe ich es gemacht?

### Dieses Projekt ist tatsächlich mein Abschlussprojekt des Kurses „Entwicklung mit KI – der neue Programmierer“ von „Brais Mouredev“. Hier ist der Link zum ersten Tag: https://www.youtube.com/live/qHYi92zRn-s.

#

### Und ja, ich habe es mit KI gemacht, aber ich habe dabei sehr viele interessante Dinge gelernt, die für die Entwicklung einer Anwendung sehr nützlich sind. Denn einem wird nicht beigebracht, wie man einer KI kontrolliert und verantwortungsvoll sagt, was sie machen soll, und das Wichtigste: „zu jedem Zeitpunkt zu wissen, was sie macht“.

#

## Wie habe ich es gemacht?

1. Ich habe den Kurs verfolgt und die Notizen verwendet, die er uns mit den Prompts und Erklärungen zur Vorgehensweise gegeben hat. Gleichzeitig habe ich auch das Video angeschaut, um zu wissen, wie man es praktisch macht.

2. Der Kurs begann damit, dass er uns erklärte, was wichtig ist, um Entwickler zu sein, und dass sich die Branche mit dem Aufkommen der KI im Jahr 2023 verändert hat und wir uns daran anpassen müssen.

3. Danach erklärte er uns wichtige Begriffe, die wir kennen mussten, zum Beispiel LLMs.

4. Anschließend zeigte er uns die besten Tools für den Kurs. Da er sich für OpenCode und Cursor entschieden hatte, entschied ich mich auch, OpenCode herunterzuladen und danach VS Code als Editor zu verwenden.

5. Nachdem ich die Tools hatte, erklärte er uns zunächst, wie man einen klassischen Prompt mit Rolle → Kontext → genaue Aufgabe → Einschränkungen oder Regeln → Ausgabeformat erstellt.

6. Danach haben wir den ersten klassischen Prompt gestartet, um eine erste Version der Anwendung zu erstellen, mit der wir die Anwendung mithilfe der Agents weiterentwickeln konnten. Gleichzeitig haben wir die Anwendung auch verwendet, um die Agents zu entwickeln.

7. Danach erklärte er uns, dass Prompts immer im Markdown-Format geschrieben werden, außer wenn es sich um eine kurze, kleine Entscheidung, eine Frage oder etwas Ähnliches handelt, das nicht sehr wichtig ist.

8. Danach erstellten wir die `AGENTS.md`, in der wir sozusagen festlegen, wie der Agent genau arbeiten soll, indem wir bestimmte Fragen abdecken, zum Beispiel den Arbeitsablauf oder Verbote usw.

9. Danach erklärte er uns, was `/init` in OpenCode ist und dass es dazu dient, den Agenten die `AGENTS.md` erstellen zu lassen. Ich persönlich denke jedoch, dass das nicht viel Sinn macht, weil wir am Ende selbst die Kontrolle darüber haben müssen. Ich würde sie deshalb selbst erstellen und es nicht den Agenten machen lassen.

10. Danach erklärte er uns, was eine `MEMORY.md` ist. Sie ist eine Datei, damit der Agent, der sie beim nächsten Mal liest, weiß, wie er weitermachen soll und in welchem Zustand sich die Anwendung befindet. Sie ist so etwas wie ein kurzer, fester Speicher, damit der Agent beim nächsten Mal weiß, wie er weitermachen soll, also eine Art Dokumentation.

11. Danach erklärte er uns, wann man den Plan- oder Build-Modus in OpenCode verwendet → der eine dient zum Planen und der andere zum Implementieren.

12. Er erklärte uns auch, wann man den einen oder den anderen Modus verwenden sollte.

13. Danach erklärte er uns am zweiten Tag, was Commands und Skills sind, welche Unterschiede es gibt und wie man sie erstellt → Commands sind so etwas wie eine Abkürzung für den Benutzer und Skills sind, wie der Name schon sagt, Fähigkeiten, die ähnlich wie Commands sind, aber vom Agenten verwendet werden können, ohne dass der Benutzer sie im Chat starten muss.

14. Danach zeigte er uns, wie man offizielle Skills von offiziellen Seiten herunterlädt, damit man sie nicht jedes Mal selbst erstellen muss.

15. Danach erklärte er uns, was MCPs sind und wie man sie in das Projekt integriert, zum Beispiel Chrome DevTools, das wir hauptsächlich verwendet haben, um das Projekt zu überprüfen und zu sehen, ob alles richtig funktioniert. Außerdem empfahl er uns Context7 und erklärte uns, dass es sich dabei um einen MCP handelt, damit der Agent möglichst aktuelle Informationen hat.

16. Danach gingen wir zum Spec-Driven Development (SDD) über. Das ist ein sehr komplexer Arbeitsablauf, um mit einer guten Planung zu entwickeln → danach eine Überprüfung → danach die Implementierung → danach wieder eine Überprüfung → und dann ist es fertig.

17. Danach haben wir es im Projekt implementiert und einen Skill erstellt, der den gesamten SDD-Ablauf beschreibt, damit der Agent ihn jedes Mal verwenden kann, wenn er benötigt wird.

18. Am Ende gab er uns als Übung die Aufgabe, jedes SDD-Element als einen eigenen Command zu erstellen, und genau das habe ich gemacht.

19. Der dritte Tag war der beste von allen und auch der interessanteste, weil wir buchstäblich alles automatisiert haben, was wir zuvor mit Agents und Subagents gemacht hatten.

20. Er begann damit, uns den Unterschied zwischen Agent und Subagent zu erklären → der Agent ist derjenige, mit dem man im OpenCode-Chat spricht, und der Subagent ist derjenige, der im Hintergrund arbeitet, während der Agent mit einem spricht.

21. Danach erstellten wir unsere Gruppe aus Agents und Subagents, die so aussah: Coordinator (Agent) gibt Anweisungen an ↓ Planner (derjenige, der den Plan erstellt) ↓ Implementer (derjenige, der den Plan umsetzt) ↓ Reviewer (Prüfer, der alles überprüft).

22. Danach erstellten wir die Beschreibung dafür, was jeder einzelne machen muss, damit alles funktioniert.

23. Am Ende des Videos stellte er uns seinen Masterkurs für Entwicklung mit KI vor.

24. Und damit war der Kurs beendet.

# Zertifizierung

`Certificate-Brian-Garrido-Rellan-pzt5tubv.pdf` (befindet sich in den Dateien des zweiten Repositorys)

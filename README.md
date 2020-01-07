
![logo](/assets/logo.png)

Nodebook is a tool to explore the treasure trove of your Evernote data. It is meant to help you visually wander around your notes and discover new connections.
It was inspired by the Roam note taking tool.
NodeBook takes all your Evernote notes and searches titles inside other notes, coming up with the reference graph.

### Features
- Visual representation of your knowledge
- Once you click on the nod(t)e, you can hide it - especially useful for "Superconnnectors" that introduce a noise to the graph
- To reduce noise further, you can hide whole notebooks from the system menu
- You can save the state of your graph to work in multiple sessions 

## Installing

**Warning: This is mac only for now**

1. Download [this file](https://github.com/artpi/NodeBook/raw/master/dist/NodeBook-0.1.0.dmg).
1. If you have trouble with permissions, this is because I don't have apple developer account. You may need to [follow this guide](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=11&cad=rja&uact=8&ved=2ahUKEwjolIf6gvLmAhWq1aYKHTnPAekQFjAKegQIBhAB&url=https%3A%2F%2Fsupport.apple.com%2Fguide%2Fmac-help%2Fopen-a-mac-app-from-an-unidentified-developer-mh40616%2Fmac&usg=AOvVaw0iabaIl01xG0keoFR2n8it)
1. Once you install the app, you should see the welcome screen
1. Click on the system menu, choose "Load from Evernote"
1. Now, the app will try to automatically find your Evernote installation and load the data from there. If it won't find it, you have to manually find `localNoteStore/LocalNoteStore.sqlite`
1. ONce notes are loaded, the app will render a graph. Sometimes you have to pan the rendered screen with scroll wheel to find it.

## Contributing
1. PRs welcome!
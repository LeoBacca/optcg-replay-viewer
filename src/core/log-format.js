// Il formato dei combat log di OPTCGSim: le espressioni che riconoscono i tipi di riga.
//
// Un log ha tre tipi di riga:
//   1. testo leggibile      [You] Deploy Nami ["OP01-016">OP01-016]
//   2. mossa (MOVE)         RZ1|seq|giocatore|codice|daZona|daPosto|aZona|aPosto|f1|f2|f3
//   3. controllo (CHK)      RZ1|CHK|seq|giocatore|quante carte ci sono in ogni zona dopo la mossa
//
// Le zone, nei numeri delle mosse (in tutto il codice: fz = zona di partenza, tz = zona di arrivo, fi/ti = posto):
//   0 mazzo · 1 mano · 2 personaggi · 3 life · 4 mazzo dei DON · 5 Cost Area (DON) · 6 trash · 7 stage · 9 DON attaccato a una carta
// f3 dice se la carta arriva riposata (o, per i DON nella Cost Area, se viene riposata).

export const REF_G = /(.+?) \["([A-Za-z0-9\-_]+)">\2\]/g; // Name ["ID">ID]
// i log salvati da soli dal sim (cartella AutoSaved) tengono il markup intero: Name [<mark><link="ID">ID</link></mark>]
export const RICH_REF = /<mark><link=("([A-Za-z0-9\-_]+)">\2)<\/link><\/mark>/g;
export const MOVE = /^RZ1\|(\d+)\|([12])\|([^|]+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|([01])\|([01])\|([01])/;
export const CHK = /^RZ1\|CHK\|(\d+)\|([12])\|(.*)$/;
export const ACTOR = /^\[([^\]]+)\] ?(.*)$/;
export const TAGS = /<\/?[a-z][^>]*>/gi;
export const ZWSP = /[​-‍﻿]/g;

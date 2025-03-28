# Anki advanced note types

## Types

Comes with 3 types of note:

- Advanced
- Advanced (and reversed card)
- Advanced (reveal)

They all share the same layout and styling.

### Reveal type

The reveal type allow positionning items over a picture.

It requires the following html markup to be used:

```html
<img class="reveal-background" src="...">

<div class="reveal ...Options..." style="right:...%;top:...%;width:...%;height:...%;">
    <input id="...item-id..." type="checkbox">
    <label for="...item-id...">...Optional label...</label>
    <div>...Revealed content...</div>
</div>

<div class="reveal ...Options...">...</div>
...
```

#### Reveal in advanced type

To use the reveal feature without reveal card type, surround the html markup with the following code:

```html
<div class="reveal-container ...GlobalRevealOptions...">...</div>
```

#### Global reveal options

- revealed
- centered
- reversible
- hideable
- front/back-transparent
- front/back-gradient
- front/back-text-white
- front/back-text-red

#### Items reveal options

- revealed
- centered
- not-centered
- reversible
- hideable
- front/back-transparent
- front/back-gradient
- front/back-text-black
- front/back-text-white
- front/back-text-red

## Layout

The cards are composed of header to show card's deck in a way it's not too distracting.

Following, there is the main card frame designed to focus attention.
It has rounder borders and is standing out with shadows.

Main card frame is split in 3 parts:

- Front part
- Back part
- Mnemonic part

Finally, below the main frame is a space to display source of information to the card.
Its font size is smaller and it should be used to display links to relevant sources.
If only a link is used, it will be click-able and displayed first.

### Front part

The front part is displayed on top in a blue-ish color, except for the reversed card displayed in a red-ish color.

### Back part

The back part is displayed in white, with a minimal size when empty (answer not shown), etending in size as required.

### Mnemonic part

The mnemonic part is optional and can be used to store a way to remember the content.
It is only shown along the answer at the moment.
It is displayed in a yellow-ish color with a light bulb icon, if not empty.

## Fields

- Front
- Back
- Mnemonic
- Source
- SourceLink
- Comments
- RevealOptions (only for reveal type)

## Improvements

- Make the mnemonic part visible from front card if the light bulb is clicked
- Allow for sequential reveals
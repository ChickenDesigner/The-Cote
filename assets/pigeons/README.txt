DROP YOUR PIGEON GIFS IN THIS FOLDER
====================================

The game draws every bird itself (a pixel pigeon rasterised from its genotype),
so it is fully playable with this folder empty. But if a file with the right
name is here, it is used instead — which is how your animated GIFs get in.

Accepted extensions: .gif (tried first) then .png


FILENAME FORMULA
----------------

    <series>[_pale][_dilute]_<pattern>.gif

  series   : blue | ashred | brown | recred | white
  dilution : (nothing) for intense, "_pale", or "_dilute"
  pattern  : bar | check | tcheck | barless | spread

Special cases:
  * recessive red has no pattern part      ->  recred.gif, recred_dilute.gif
  * recessive white is always just         ->  white.gif
  * baby birds are always                  ->  squab.gif


WHERE YOUR 12 GIFS GO
---------------------

  squab.gif               the fluffy cream nestling
  blue_bar.gif            grey bird, two dark wing bars, green neck
  blue_check.gif          same but chequered wing
  blue_tcheck.gif         the very dark chequered one
  blue_spread.gif         the solid navy/black bird
  blue_dilute_bar.gif     the very pale silver bird with grey bars
  ashred_bar.gif          grey head, maroon shoulder, maroon wing bars
  ashred_check.gif        same but chequered
  ashred_dilute_bar.gif   the palest cream/ash bird
  brown_spread.gif        the solid dark chocolate bird
  recred.gif              the solid brick-red bird
  white.gif               the pure white bird


FALLBACKS (so you never need all of them)
-----------------------------------------

If the exact file is missing the game tries, in order:

  1. the exact key
  2. brown -> ashred            (brown bar borrows the red bar art, as requested)
  3. _pale -> intense
  4. tcheck -> check, barless -> bar
  5. the built-in pixel renderer

So brown_bar.gif is not needed: a brown bar bird will use ashred_bar.gif and its
info page will still say Brown, and any bird that merely *carries* brown shows
its own visible colour with "carries Brown" listed under its genotype.


NOTE ON SIZE
------------
Any square GIF works; it is scaled to the card size with pixelated rendering.
Your 360x360 files are ideal.

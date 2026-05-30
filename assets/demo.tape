# VHS tape for the Claude Arcade demo GIF.
#   brew install vhs
#   vhs assets/demo.tape   ->  assets/demo.gif
#
# This records the arcade standalone (no tmux needed) so the games are the star.
# For the full "Claude on the left, game on the right" shot, record your real
# tmux session with asciinema instead.

Output assets/demo.gif

Set Shell "bash"
Set FontSize 20
Set Width 900
Set Height 640
Set Padding 20
Set Theme "Catppuccin Mocha"
Set Framerate 24
Set PlaybackSpeed 1.0

Hide
Type "bun arcade/arcade.ts"  Enter
Sleep 1s
Show

# Browse the menu
Sleep 1s
Down Sleep 500ms
Down Sleep 500ms
Up   Sleep 500ms

# Play a little Snake
Enter Sleep 1s
Right Sleep 400ms
Down  Sleep 400ms
Left  Sleep 400ms
Up    Sleep 600ms

# Cycle to the next games
Tab Sleep 1200ms
Tab Sleep 1200ms
Tab Sleep 1500ms

# Open settings
Type "c" Sleep 1500ms
Escape   Sleep 800ms

Sleep 1s

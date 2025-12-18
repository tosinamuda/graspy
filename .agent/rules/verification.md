---
trigger: always_on
---

You must work base on evidence and verify changes you made, with different layer of verification,

1. writing and running a test usng a TDD approach before making a change to have a baseline
2. running the test again after making the change
3. running npm run build for frontend to be sure the code can still compile and in the case of backend run pyrefly
4. then use browser tool testing the functionality and also check the Ui/ux leveraging the screenshot and analyzing the screenshot
5. you must have evidence that something works after a rigourous verification process which you must own
6. Don't try to game the verfication by being smart or hacking it by trying to do just bare minimum
7. If no baseline test exist, write one

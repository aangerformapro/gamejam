/**
 * SCSS Style
 */
import '../scss/main.scss';
import GameWorld from './game/GameWorld.js';
import { SoundEffect, SoundTrack } from './game/SoundSystem';





// init game engine

const world = new GameWorld({
    element: document.querySelector('#game')
});

// listen to keyboard events


addEventListener('keydown', e =>
{




    const { key } = e;

    console.debug(key);

    // space key
    if (key === ' ')
    {
        if (world.paused)
        {
            return;
        }

        e.preventDefault();
        if (!world.hero.isJumping)
        {
            world.hero.isJumping = true;
            SoundEffect.JUMP.play();
        }
    }
    // pause key
    else if (key === 'p')
    {
        e.preventDefault();
        if (!world.paused)
        {
            world.pause();
        } else
        {
            world.resume();
        }
    }

    // atttttackk !!!

    else if (key === "e")
    {
        if (world.paused)
        {
            return;
        }

        e.preventDefault();

        if (!world.hero.isAttacking)
        {
            world.hero.isAttacking = true;
        }

    }




});


addEventListener('click', ({ target }) =>
{
    if (world.paused)
    {
        return;
    }

    if (target.closest('#game') && !world.hero.isAttacking)
    {
        world.hero.isAttacking = true;
    }


});



// world.on('started resume', () =>
// {
//     SoundTrack.pauseAll();



//     console.debug(SoundTrack.cases()[world.stage.level]);
//     SoundTrack.cases()[world.stage.level].play();
// });

// engage full warp !!!
world.init();


/**
 * SCSS Style
 */
import '../scss/main.scss';
import GameWorld from './game/GameWorld.js';
import { SoundEffect, SoundTrack } from './game/SoundSystem';

const
    menu = document.querySelector('.start-menu'),
    death = document.querySelector('.death-container'),
    levelup = document.querySelector('.level'),
    victory = document.querySelector('.victory'),
    pause = document.querySelector('.pause'),
    credits = document.querySelector('.credits'),
    goty = document.querySelector('#goty');



// init game engine

let world;

// listen to keyboard events


addEventListener('keydown', e =>
{

    const { key } = e;

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

    if (!world)
    {
        return;
    }
    if (world.paused)
    {
        return;
    }

    if (target.closest('#game') && !world.hero.isAttacking)
    {
        world.hero.isAttacking = true;
    }


});





menu.addEventListener('click', e =>
{

    const { target } = e;
    if (target.closest('.start-menu-btn'))
    {
        world = new GameWorld({
            element: document.querySelector('#game')
        });


        world.on('paused', () =>
        {
            pause.hidden = null;
        }).on('resume started', () =>
        {
            pause.hidden = true;
        }).on('stagecleared', () =>
        {
            pause.hidden = true;

            if (world.stage.stage === 8)
            {
                victory.hidden = null;
            }
            else
            {
                levelup.hidden = null;


                setTimeout(() =>
                {
                    levelup.hidden = true;
                    world.stage.level++;
                }, 3500);

            }


        }).on('dead', () =>
        {

            death.querySelector('.score-span').innerHTML = document.querySelector('#score').innerHTML;
            death.querySelector('.time-span').innerHTML = document.querySelector('#time').innerHTML;
            pause.hidden = true;
            death.hidden = null;

        }).on('levelchange', () =>
        {


            const { hero } = world;

            while (hero.hp < hero.maxHP)
            {
                if (world.score >= 1000)
                {
                    world.score -= 1000;
                    hero.hp++;
                } else
                {
                    break;
                }
            }

            world.resume();


        });


        menu.hidden = true;
        goty.hidden = true;

        world.init();



    } else if (target.closest('.start-menu-credit'))
    {
        credits.hidden = null;
    }

});


credits.addEventListener("click", () =>
{
    credits.hidden = true;
});


pause.addEventListener("click", ({ target }) =>
{
    if (target.closest('button'))
    {
        world.resume();

    }
});

death.addEventListener("click", ({ target }) =>
{
    if (target.closest(".retry"))
    {

        death.hidden = true;
        world.destroy();
        menu.hidden = null;
        goty.hidden = null;


    }
});

victory.addEventListener("click", () =>
{
    victory.hidden = true;
    world?.destroy();
    menu.hidden = null;
    goty.hidden = null;
});


/**
 * SCSS Style
 */
import '../scss/main.scss';
import GameWorld from './game/GameWorld.js';
import { SoundEffect } from './game/SoundSystem';

const
    menu = document.querySelector('.start-menu'),
    death = document.querySelector('.death-container'),
    levelup = document.querySelector('.level'),
    victory = document.querySelector('.victory'),
    pause = document.querySelector('.pause'),
    credits = document.querySelector('.credits'),
    goty = document.querySelector('#goty'),
    gameStage = document.querySelector('.stage-span');





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
            SoundEffect.SLASH.play();
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
        SoundEffect.SLASH.play();
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
                SoundEffect.pauseAll();

                victory.querySelector('.score-span').innerHTML = world.score;
                victory.querySelector('.time-span').innerHTML = world.time;
                victory.querySelector('.killed-span').innerHTML = world.hero.killCount;
                victory.hidden = null;

                SoundEffect.LEVEL.play().then(() =>
                {

                    victory.addEventListener("click", () =>
                    {
                        victory.hidden = true;
                        world.destroy();
                        menu.hidden = null;
                        goty.hidden = null;
                    }, { once: true });

                });

            }
            else
            {


                const { hero } = world;

                const before = { hp: hero.hp, score: world.score };

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

                levelup.querySelector('.score .before').innerHTML = before.score;
                levelup.querySelector('.lives .before').innerHTML = before.hp;

                levelup.querySelector('.score .diff').innerHTML = Math.abs(before.score - world.score);
                levelup.querySelector('.lives .diff').innerHTML = Math.abs(hero.hp - before.hp);

                levelup.querySelector('.score .current').innerHTML = world.score;
                levelup.querySelector('.lives .current').innerHTML = hero.hp;

                levelup.hidden = null;
                SoundEffect.pauseAll();
                SoundEffect.LEVEL.play().then(() =>
                {
                    levelup.hidden = true;
                    world.stage.level++;
                });
            }


        }).on('dead', () =>
        {

            death.querySelector('.score-span').innerHTML = world.score;
            death.querySelector('.time-span').innerHTML = world.time;
            death.querySelector('.killed-span').innerHTML = world.hero.killCount;
            pause.hidden = true;
            death.hidden = null;

        }).on('levelchange', () =>
        {
            gameStage.innerHTML = world.stage.stage;
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
    if (target.closest('.ctn-img'))
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




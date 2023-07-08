
import { Chronometer, TimeReader } from "../../modules/components/timer.mjs";
import { decode } from "../../modules/utils/utils.mjs";
import Hiro from "./Hiro";
import Stage from "./Stage";
import { EventManager } from './../../modules/utils/event-manager.mjs';
import { dataset } from './../../modules/utils/dataset.mjs';
import GameObject from "./GameObject";



let init = false;


export default class GameWorld
{


    element;
    paused = true;
    timeout = null;

    score = 0;

    // ~30 secs
    loopsToClearStage = 15;

    objects = [];

    get ctx()
    {
        return this.canvas.getContext('2d');
    }


    get width()
    {
        return decode(this.canvas.width);
    }


    get height()
    {
        return decode(this.canvas.height);
    }


    get time()
    {
        const reader = TimeReader.of(this.chrono.elapsed);
        return (reader.hours > 0 ? reader.hours + ':' : '') + reader.minutes + ':' + reader.seconds;
    }


    constructor({ element } = {})
    {

        EventManager.mixin(this, false);

        this.element = element;
        this.chrono = new Chronometer(false);
        this.displayScore = element.querySelector('#score');
        this.displayTime = element.querySelector('#time');
        this.displayHP = element.querySelector('#lives');
        this.displayKill = element.querySelector('.killed-span');
        this.displayHeart = element.querySelector('.heart-span');
        this.canvas = element.querySelector('canvas');



    }


    destroy()
    {
        this.pause();
        init = false;

        this.objects.forEach(obj => obj.destroy());

        requestAnimationFrame(() => this.clearScreen());

    }


    /**
     * Destroy a game object and prevent it from being drawn
     */
    destroyObject(gameobject)
    {
        if (gameobject instanceof GameObject)
        {

            let index = this.objects.indexOf(gameobject);
            if (index > -1)
            {
                gameobject.destroy();
                this.objects.splice(index, 1);
            }

        }
    }


    init()
    {
        if (!init)
        {
            this.stage = new Stage(this);
            this.hero = new Hiro(this);
            this.objects.length = 0;
            this.stage.level = 0;
            this.resume();
        }

    }



    pause()
    {

        if (!this.paused)
        {
            this.paused = true;
            this.chrono.pause();
            if (this.timeout)
            {
                // clearTimeout(this.timeout);
                cancelAnimationFrame(this.timeout);
                this.timeout = null;
            }

            this.trigger('paused');
        }

    }


    resume()
    {

        if (this.paused)
        {
            this.paused = false;
            if (this.chrono.stopped)
            {
                this.chrono.start();
                this.trigger('started');
            } else
            {
                this.chrono.resume();
                this.trigger('resume');
            }
            requestAnimationFrame(() => this.draw());

        }


    }



    clearScreen()
    {
        // clears ouput before redrawing
        this.ctx.clearRect(0, 0, this.width, this.height);
    }


    draw()
    {

        if (this.paused)
        {
            return;
        }


        const { displayScore, displayTime, displayHP, displayKill, displayHeart } = this;


        this.clearScreen();


        // draw first
        this.stage.draw();

        // draw other objects (enemies)
        this.objects.forEach(obj => obj.draw());

        // draw last
        this.hero.draw();

        // this is generated after as score can change when drawing
        displayScore.innerHTML = this.score;
        displayTime.innerHTML = this.time;

        dataset(displayHP, 'lives', this.hero.hp);

        displayHeart.innerHTML = this.hero.hp;

        displayKill.innerHTML = this.hero.killCount;




        // real 60-90 fps (faster than timeout)
        this.timeout = requestAnimationFrame(() => this.draw());


        // this.timeout = setTimeout(() =>
        // {
        //     requestAnimationFrame(() => this.draw());
        // }, 16); // ~60 fps
    }
}

import { Chronometer, TimeReader } from "../../modules/components/timer.mjs";
import { decode } from "../../modules/utils/utils.mjs";
import Hiro from "./Hiro";
import Stage from "./Stage";
import { EventManager } from './../../modules/utils/event-manager.mjs';
import { dataset } from './../../modules/utils/dataset.mjs';



let init = false;


export default class GameWorld
{


    element;
    paused = true;
    timeout = null;

    score = 0;

    // ~60 secs
    loopsToClearStage = 20;

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
        this.element = element;
        this.chrono = new Chronometer(false);
        this.displayScore = element.querySelector('#score');
        this.displayTime = element.querySelector('#time');
        this.displayHP = element.querySelector('#lives');
        this.canvas = element.querySelector('canvas');

        EventManager.mixin(this, false);

    }


    destroy()
    {
        this.pause();
        init = false;

        requestAnimationFrame(() => this.clearScreen());

    }


    init()
    {
        if (!init)
        {
            this.stage = new Stage(this);
            this.hero = new Hiro(this);
            this.objects.length = 0;
            this.objects.push(this.stage, this.hero);
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
                clearTimeout(this.timeout);
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


        const { displayScore, displayTime, displayHP } = this;





        this.clearScreen();


        // draw objects
        this.objects.forEach(obj => obj.draw());

        // this is generated after as score can change when drawing
        displayScore.innerHTML = this.score;
        displayTime.innerHTML = this.time;

        dataset(displayHP, 'lives', this.hero.hp);


        this.timeout = setTimeout(() =>
        {
            requestAnimationFrame(() => this.draw());
        }, 16); // ~60 fps
    }
}
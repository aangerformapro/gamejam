
import { TimeReader } from "../../modules/components/timer.mjs";
import Hiro from "./Hiro";
import Stage from "./Stage";


export default class GameWorld
{



    get ctx()
    {
        return this.canvas.getContext('2d');
    }


    constructor({ element, chrono, timer } = {})
    {
        this.canvas = element.querySelector('canvas');

        this.chrono = chrono;
        this.timer = timer;
    }


    init()
    {




        this.chrono.start();
        this.stage = new Stage(this);
        this.hero = new Hiro(this);
        console.debug(this.ctx);


        requestAnimationFrame(() => this.draw());
    }


    draw()
    {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let time = new TimeReader(this.chrono.elapsed), str = '';

        if (time.hours > 0)
        {
            str += time.hours + ':';
        }



        str += time.minutes + ':';

        str += time.seconds;

        this.timer.innerHTML = 'temps : ' + str;


        this.stage.draw();// tj en premier
        this.hero.draw();



        setTimeout(() =>
        {
            requestAnimationFrame(() => this.draw());
        }, 16);
    }
}
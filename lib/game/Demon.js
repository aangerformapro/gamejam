import { BackedEnum, isUndef } from "../../modules/utils/utils.mjs";
import GameObject from "./GameObject";
import { animate } from "./Hiro";
import { ENEMY } from "./constants";



const SPRITES = [
    [...Array(9)].map((_, n) => ENEMY + '/cyclops/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/minos/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/wherewolf/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/orc/' + (n + 1) + '.png'),

];


const STATES = new Map([
    [
        'moving', [
            // sprites
            [...Array(9)].map((_, n) => ENEMY + '/demon/moving/' + (n + 1) + '.png'),

            //can loop
            true
        ]

    ]

]);


const animationMoving = new Map();


export class DemonState extends BackedEnum
{
    static MOVING = new DemonState('moving');


    get sprites()
    {
        return STATES.get(this.value)[0];
    }



    getAnimation(instance)
    {

        if (!animationMoving.has(instance))
        {
            animationMoving.set(instance, animate(instance.sprites));
        }
        return animationMoving.get(instance);
    }
}



export default class Demon extends GameObject
{


    isEnemy = true;
    isDead = false;

    #points;
    // gain score when intersecting non ennemy object || intersecting ennemy + attacking
    get scoreGain()
    {
        return this.#points ??= Math.ceil(Math.random() * 500);
    }

    // GameObject implementation


    get width()
    {
        return this.world.hero.width;
    }

    get height()
    {
        return this.world.hero.height;
    }


    get y()
    {
        return this.world.hero.maxY;
    }

    set y(value)
    {
        //noop
    }

    // end of the map
    #x;
    get x()
    {
        return this.#x ??= this.world.width + Math.floor(Math.random() * this.world.width * Math.ceil(Math.random() * 3));
    }

    set x(value)
    {
        this.#x = value;
    }


    #sprites;

    get sprites()
    {
        return this.#sprites ??= SPRITES[Math.floor(Math.random() * SPRITES.length)];
    }

    // demon state
    state = DemonState.MOVING;


    // points to the current sprite (false sets state to moving)
    currentSprite = false;




    draw()
    {

        const { ctx } = this;

        this.move();


        // don't draw it out of the canvas
        if (this.x > this.world.width - this.width)
        {
            return;
        }



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );

    }



    move()
    {

        this.state = DemonState.MOVING;


        // move with the stage
        if (!this.world.hero.isDead)
        {
            this.currentSprite = this.state.getAnimation(this)();
            this.x -= this.world.stage.speed;
        }



        if (this.x <= 0)
        {
            this.#x = null;
        }

    }


    destroy()
    {

        super.destroy();

        this.isDead = true;
    }


}
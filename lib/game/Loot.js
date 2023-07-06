import { BackedEnum } from "../../modules/utils/utils.mjs";
import GameObject from "./GameObject";
import { animate } from "./Hiro";
import { ENEMY } from "./constants";

const SPRITES = [...Array(3)].map((_, n) => ENEMY + '/loot/' + (n + 1) + '.png');




const animationMoving = new Map();


export class LootState extends BackedEnum
{
    static MOVING = new LootState('moving');


    get sprites()
    {
        return STATES.get(this.value)[0];
    }



    getAnimation(instance)
    {

        if (!animationMoving.has(instance))
        {
            animationMoving.set(instance, animate(SPRITES));
        }
        return animationMoving.get(instance);
    }
}


export default class Loot extends GameObject
{




    // implement gameObject
    width = 100;
    height = 100;

    y = 150;


    #x = null;
    get x()
    {
        return this.#x ??= this.world.width + Math.floor(Math.random() * this.world.width * Math.ceil(Math.random() * 3));

    }

    set x(value)
    {
        this.#x = value;
    }
    #points;
    get scoreGain()
    {
        return this.#points ??= Math.ceil(Math.random() * 250);
    }

    isEnemy = false;
    isDead = false;



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

        this.state = LootState.MOVING;


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
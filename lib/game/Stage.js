import { decode } from "../../modules/utils/utils.mjs";
import GameObject from "./GameObject";
import { WORLDS } from "./constants";


const STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png');




export default class Stage extends GameObject
{


    // STAGES[level]
    level = 0;

    // number of loops n * (deltaX === width)
    loops = 0;


    // max loops before clearing stage
    get maxLoops()
    {

        return this.world.loopsToClearStage;
    }


    speed = 10;
    deltaX = 0;


    // GameObject implementation

    x = 0;
    y = 0;

    get width()
    {
        return this.world.width;
    }

    get height()
    {
        return this.world.height;
    }

    #image;

    get decor()
    {

        this.#image ??= new Image();
        const src = STAGES[this.level] ?? STAGES[0];
        if (!this.#image.src.endsWith(src))
        {
            this.#image.src = src;
        }


        return this.#image;
    }




    draw()
    {


        const { decor, ctx } = this;
        this.deltaX += this.speed;
        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;
            this.loops++;

            console.debug(this.loops);

            if (this.loops >= this.maxLoops)
            {
                this.world.pause();
                this.world.trigger('stagecleared');

                alert('stage cleared !!!');

            }


        }


        ctx.drawImage(decor,
            this.deltaX, 0,
            this.width - this.deltaX, this.height,
            0, 0,
            this.width - this.deltaX, this.height
        );

        ctx.drawImage(decor,
            0, 0,
            this.deltaX, this.height,
            this.width - this.deltaX, 0,
            this.deltaX, this.height

        );



    }
}
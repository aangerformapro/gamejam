import { decode } from "../../modules/utils/utils.mjs";
import { WORLDS } from "./constants";


const STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png');




export default class Stage
{



    level = 1;

    scrollSpeed = 10;
    deltaX = 0;

    get width()
    {
        return decode(this.world.canvas.width);


    }

    get height()
    {
        return decode(this.world.canvas.height);
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

    constructor(world)
    {
        this.world = world;
    }



    draw()
    {
        const { ctx } = this.world;
        let { decor } = this;
        this.deltaX += this.scrollSpeed;
        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;

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
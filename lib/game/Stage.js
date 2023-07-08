import dataset from "../../modules/utils/dataset.mjs";
import Demon from "./Demon";
import GameObject from "./GameObject";
import Loot from "./Loot";
import { SoundEffect, SoundTrack } from "./SoundSystem";
import { WORLDS } from "./constants";
import createLoader from "./loader";




const loader = createLoader();

function loadPicture(src)
{
    const elem = new Image();
    loader(elem);
    elem.src = src;
    return elem;
}


const
    STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png'),
    PICTURES = STAGES.map(loadPicture);





export default class Stage extends GameObject
{


    // STAGES[level]

    #level = 0;

    get level()
    {
        return this.#level;
    }

    set level(value)
    {
        this.#level = value;
        dataset(this.canvas, 'stage', this.stage);
        this.reset();
        this.world.trigger('levelchange');
    }

    enemies = 0;
    enemiesPerStageRatio = 8;


    get soundtrack()
    {
        return SoundTrack.cases()[this.level];
    }

    get maxEnemies()
    {
        return this.stage * this.enemiesPerStageRatio;
    }

    get stage()
    {
        return this.level + 1;
    }

    // number of loops n * (deltaX === width)
    loops = 0;

    loopIncreased = false;


    // max loops before clearing stage
    get maxLoops()
    {

        return this.world.loopsToClearStage;
    }


    speed = 8;
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


    get picture()
    {
        return STAGES[this.level] ?? STAGES.slice(-1)[0];
    }


    get decor()
    {

        return PICTURES[this.level] ?? PICTURES.slice(-1)[0];
    }

    get canvas()
    {
        return this.world.canvas;
    }




    reset()
    {
        this.enemies = this.deltaX = this.loops = 0;
        this.loopIncreased = false;
        this.world.objects.length = 0;
        this.canvas.style = '';
    }

    draw()
    {

        this.generateEnemies();

        const { canvas } = this;

        if (!this.world.hero.isDead)
        {
            this.deltaX += this.speed;
        }

        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;
            this.loops++;
            this.loopIncreased = true;


            if (this.loops >= this.maxLoops)
            {
                this.world.pause();
                this.world.trigger('stagecleared');
            }


        }

        // using background as it says there: 
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
        canvas.style.backgroundPositionX = `-${this.deltaX}px`;
    }



    generateEnemy()
    {
        if (this.enemies < this.maxEnemies)
        {
            this.world.objects.push(new Demon(this.world));
            this.world.objects.push(new Loot(this.world));
            this.enemies++;
        }

    }


    generateEnemies()
    {
        if (this.enemies === 0 || this.loopIncreased)
        {
            if (this.loopIncreased)
            {
                this.loopIncreased = false;
            }

            if (this.enemies < this.maxEnemies)
            {
                this.generateEnemy();
            }
        }
    }


    constructor(world)
    {
        super(world);
        world
            .on('started resume levelchange', ({ type }) =>
            {
                SoundTrack.pauseAll();
                if (type === 'levelchange')
                {
                    this.soundtrack.play();
                } else
                {
                    this.soundtrack.resume();
                }

            })
            .on('paused stagecleared', () =>
            {
                this.soundtrack.pause();
            });


    }
}
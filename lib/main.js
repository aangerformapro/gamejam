
/**
 * Put it last if overriding other styles
 */
import { Chronometer } from '../modules/components/timer.mjs';
import '../scss/main.scss';
import GameWorld from './game/GameWorld.js';
const timer = document.querySelector('.time'), chrono = new Chronometer();




// Variables de base pour le saut, la collision, le déplacement des images

const world = new GameWorld({
    element: document.querySelector('#game'),
    timer,
    chrono

});

world.init();







// addEventListener('keyup', ({ key }) =>
// {

//     console.debug(key === ' ');



// });
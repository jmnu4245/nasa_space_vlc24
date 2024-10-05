const SCALE = 62;

class Planeta {
    constructor(tamaño, posicion, textura) {
    this.tamaño = tamaño;
    this.posicion = posicion;
    this.textura = textura;
    //Donde tamaño es un float, posición es un vector de tres componentes y textura es un string.
    }
    cambiarPosicion= function(nuevaPosicion)
    {
        if (nuevaPosicion.length == 3){
            this.posicion = nuevaPosicion/SCALE
            ;
        }else{
            console.log("Error: la nueva posición no tiene tres componentes");
        }
    }
        
}
export default Planeta;
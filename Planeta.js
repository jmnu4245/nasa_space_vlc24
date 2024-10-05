const SCALE = 62;

class Planeta {
    constructor(tamaño, posicion, textura, velocidadRotacion) {
    this.tamaño = tamaño;
    this.posicion = posicion;
    this.textura = textura;
    this.velocidadRotacion = velocidadRotacion;
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
export default Planeta; // Exportar la clase Planeta

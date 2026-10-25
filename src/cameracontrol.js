export function updateCameraPosition(camera,cameraData,radius) {
    let phi=cameraData.phi;
    let theta=cameraData.theta;
    let center=cameraData.center;
    camera.position.x = center.x+ radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = center.y+ radius * Math.cos(phi);
    camera.position.z = center.z+ radius * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(center); // Siempre mirar al centro
}
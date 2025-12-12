precision mediump float;
varying vec2 vUv;
void main() {
    float value = (vUv.x + vUv.y)/2.0;
    gl_FragColor = vec4(value*vec3(1.0,1.0,1.0),1.0);
}
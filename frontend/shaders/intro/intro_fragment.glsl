precision mediump float;
varying vec2 vUv;
void main() {
    float value = (sin(vUv.x*6.28*10.0)+1.0)/2.0;
    vec3 color = value*vec3(0.75,0.0,0.0) + (1.0-value)*vec3(0.5,0.0,0.0);
    gl_FragColor = vec4(color,1.0);
}
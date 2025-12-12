precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec4 uColor;
void main() {
    vec4 color = texture2D(uTexture, vUv);
    float intensity = max(color.r,max(color.g,color.b));
    gl_FragColor = vec4(1.0,1.0,1.0,1.0) * uColor * intensity;
}
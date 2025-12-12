precision mediump float;
varying vec2 vUv;
uniform sampler2D uColorTexture;
uniform sampler2D uShadingTexture;
uniform sampler2D uBaseTexture;
uniform mat3 uColorMatrix;
void main() {
    vec4 base_color = texture2D(uBaseTexture, vUv);
    vec3 color_map = texture2D(uColorTexture, vUv).rgb;
    vec3 color = color_map * uColorMatrix;
    vec4 shading = texture2D(uShadingTexture, vUv);
    vec3 distance_base_overwrite = color_map - vec3(0.0,0.0,0.0);
    float use_base = clamp(
        1.0-sqrt(
            pow(distance_base_overwrite.r,2.0) +
            pow(distance_base_overwrite.g,2.0) +
            pow(distance_base_overwrite.b,2.0)
        ),0.0,1.0);
    float highlight = shading.r;
    highlight = (highlight-0.75)*4.0;
    highlight = clamp(highlight,0.0,1.0);
    highlight = pow(highlight,2.0)*0.1;
    vec4 highlight_color = vec4(1.0,1.0,1.0,0.0)*highlight;
    gl_FragColor = (vec4(color.rgb,1.0)*shading+highlight_color) * (1.0-use_base) +
                    base_color * use_base * vec4(1.0,1.0,1.0,shading.a);
}
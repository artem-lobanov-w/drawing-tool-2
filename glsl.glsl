
        uniform vec2 res;
        uniform vec2 mouse;
        uniform sampler2D tex;
        uniform sampler2D tex2;
        uniform sampler2D tex3;
        uniform sampler2D tPrevious;
        uniform float time;
        uniform vec2 u_mouse;
        uniform vec2 u_mousePrevious;
        uniform vec2 uMouseBlur;
        uniform vec3 colorBrash;
        uniform float lineWidth;
        uniform float lineWidthPrevious;
        uniform float isDraw;
        uniform float isPaint;
        uniform float clear;


        #define PI 3.14159265358979
        #define MOD3 vec3(.1031,.11369,.13787)
        float distanceToLine(vec2 p, vec2 a, vec2 b) {
            vec2 pa = p - a;
            vec2 ba = b - a;
            float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * t);
        }
        vec2 pLine(vec2 p, vec2 a, vec2 b) {
            vec2 pa = p - a;
            vec2 ba = b - a;
            float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return vec2(ba * t);
        }
        void main() {
          
            vec2 uv = gl_FragCoord.xy / res.y * 2.0 - 1.0;
            vec2 mousePos = u_mouse.xy / res.y * 2.0 - 1.0;
            vec2 mouse = u_mouse / res.y * 2.0 - 1.0;
            vec2 mousePrevious = u_mousePrevious / res.y * 2.0 - 1.0;
            vec2 mouseBlur = uMouseBlur / res.y * 2.0 - 1.0;
            float distToLine = distanceToLine(uv, mouse, mousePrevious);
            vec2 pL = pLine(uv, mouse, mousePrevious);
            // Интерполируем толщину линии
            float t = length(pL - mouse) / length(mousePrevious - mouse);
            float thickness = mix(lineWidth, lineWidthPrevious, t);
            // float alpha = smoothstep(thickness, thickness - 0.001, distToLine);
            
            vec4 color = vec4(colorBrash.rgb,1.0);
            
            float dist = distance(uv, mousePos);
            float d = lineWidth*0.02;
            float distFactor = smoothstep(0.0,1.0,dist/(d));
            
            vec2 uvTex = gl_FragCoord.xy / res.xy;
            // Если это первый кадр (time близко к 0), устанавливаем белый цвет
            vec4 previousColor = texture2D(tPrevious, uvTex);
            if (time < 0.1 || clear > 0.5) {
                color = vec4(1.0, 1.0, 1.0, 1.0);
            } else {
                color = vec4(previousColor.rgb, 1.0);
            }
            if(isDraw == 1.0) {
              if(isPaint == 1.0) {
                float brushSoftness = 0.3; // Регулирует мягкость краёв (меньше = мягче)
                float innerRadius = lineWidth * 0.08; // Внутренний радиус (полная непрозрачность)
                float outerRadius = lineWidth * 0.1; // Внешний радиус (полная прозрачность)
                
                float softEdge = 1.0 - smoothstep(innerRadius, outerRadius, distToLine);
                // color = mix(color, vec4(colorBrash.rgb, 1.0), softEdge*lineWidth);
                color = mix(color, vec4(colorBrash.rgb, 1.0), softEdge);
              } else {
                if(distToLine < lineWidth*0.1) {
                  float dBlur = lineWidth*0.03;
                  float distFactorBlur = smoothstep(0.0,1.2,distToLine/(dBlur*4.0));
                  float blur = 0.008 * (1.0-distFactorBlur);
                  vec3 c1 = texture2D(tPrevious, vec2(uvTex.x-blur,uvTex.y+blur)).rgb;
                  vec3 c2 = texture2D(tPrevious, vec2(uvTex.x,uvTex.y+blur)).rgb;
                  vec3 c3 = texture2D(tPrevious, vec2(uvTex.x+blur,uvTex.y+blur)).rgb;
                  vec3 c4 = texture2D(tPrevious, vec2(uvTex.x+blur,uvTex.y)).rgb;
                  vec3 c5 = texture2D(tPrevious, vec2(uvTex.x+blur,uvTex.y-blur)).rgb;
                  vec3 c6 = texture2D(tPrevious, vec2(uvTex.x,uvTex.y-blur)).rgb;
                  vec3 c7 = texture2D(tPrevious, vec2(uvTex.x-blur,uvTex.y-blur)).rgb;
                  vec3 c8 = texture2D(tPrevious, vec2(uvTex.x-blur,uvTex.y)).rgb;
                  vec3 colorBlur = (color.rgb + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8)/9.0;
                  color.rgb = colorBlur;
                } 
              }
            }

            // color = vec4(vec3(distFactor), 1.0);
            
            gl_FragColor = color;
        }
var focused = true;

window.onfocus = function() {
    focused = true;
};
window.onblur = function() {
    focused = false;
};

GRAVITY = 2.6/60; // 2.6px/second gravity

TYPES = {};

var quality = 3;

TYPES.basic_rocket = function(vector, position, child_fireworks){
  return {
    x: Math.random()*view.size.width,
    vector: [Math.random()*((Math.random()>.5)*-1)*4, Math.random()*4+5],
    trail_width: 3,
    trail_color: "red",
    explosion_delay: 60*3.6*Math.random()+2,
    tick: 0,
    mass: 250,
    child_fireworks: child_fireworks,
    trail: {
      number: 2,
      vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
        rads = ((2*Math.PI)/n)*child_n;
        //console.log([Math.sin(rads), Math.cos(rads)])
        if(child_n%2 == 0){
          return [(Math.random()*-1)/5, 0];
        }else{
          return [(Math.random()*1)/5, 0];
        }
      },
      trail_generator: function(position, tick, width, vector, parent_vector){
        position._x += parent_vector[0] * 1+(parent_vector[0]/width/2);
        position._y += parent_vector[1] * 1+(parent_vector[0]/width/2);
        if(tick%2 == 0){
          return TYPES.random_test_trail([(((Math.random()*2)-1)/4.5), Math.random()*-1], position);
        }else{
          return false;
        }
      }
    }
  }
}

TYPES.moe_firework = function(vector, position){
  return {
    x: Math.random()*view.size.width,
    vector: [Math.random()*((Math.random()>.5)*-1)*4, Math.random()*4+5],
    trail_width: 3.8,
    trail_color: "lime",
    explosion_delay: 60*3.6*Math.random()+2,
    tick: 0,
    mass: 300,
    child_fireworks: {
      number: 36,
      vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
        rads = ((2*Math.PI)/n)*child_n;
        //console.log([Math.sin(rads), Math.cos(rads)])
        /*if(child_n%2 == 0){
          return [Math.sin(rads)*3, Math.cos(rads)*child_n]
        }else{
          return [Math.sin(rads)*3, Math.cos(rads)]
        }*/
        return [Math.sin(rads)*Math.random(), Math.cos(rads)*1.2];
      },
      child_generator: function(n, vector, position){
        return TYPES.moe_firework_ember(vector, position);
      }
    }
  }
}

TYPES.moe_firework_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "rgb(167, 83, 169)",
    explosion_delay: 60*Math.random()+(60),
    tick: 0,
    mass: 75,
    trail: {
      number: 1,
      vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
        rads = ((2*Math.PI)/n)*child_n;
        //console.log([Math.sin(rads), Math.cos(rads)])
        if(child_n%2 == 0){
          return [(Math.random()*-1)/5, 0];
        }else{
          return [(Math.random()*1)/5, 0];
        }
      },
      trail_generator: function(position, tick, width, vector, parent_vector){
        position._x += parent_vector[0] * 1+(parent_vector[0]/width/2);
        position._y += parent_vector[1] * 1+(parent_vector[0]/width/2);
        if(tick%3 == 0){
          return TYPES.moe_firework_trail(vector, position);
        }else{
          return false;
        }
      }
    }
  }
}

TYPES.elotrack_pageview_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "rgb(136, 16, 16)",
    explosion_delay: 60*2.5*Math.random()+(60),
    tick: 0,
    mass: 25
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

TYPES.elotrack_pageview = function(vector, position){
  return TYPES.basic_rocket(vector, position, {
    number: 30,
    vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
      rads = ((2*Math.PI)/n)*child_n;
      //console.log([Math.sin(rads), Math.cos(rads)])
      if(child_n%2 == 0){
        return [Math.sin(rads)*.75, Math.cos(rads)*.75];
      }else{
        return [Math.sin(rads)*.5, Math.cos(rads)*.5];
      }
    },
    child_generator: function(n, vector, position){
      return TYPES.elotrack_pageview_ember(vector, position);
    }
  });
};

TYPES.osutrack_irc= function(vector, position){
  return TYPES.basic_rocket(vector, position, {
    number: 30,
    vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
      rads = ((2*Math.PI)/n)*child_n;
      //console.log([Math.sin(rads), Math.cos(rads)])
      if(child_n%2 == 0){
        return [Math.sin(rads)*.75, Math.cos(rads)*.75];
      }else{
        return [Math.sin(rads)*.5, Math.cos(rads)*.5];
      }
    },
    child_generator: function(n, vector, position){
      return TYPES.osutrack_default_ember(vector, position);
    }
  });
};

TYPES.ameotrack_fireworks = function(vector, position){
  return TYPES.basic_rocket(vector, position, {
    number: 30,
    vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
      rads = ((2*Math.PI)/n)*child_n;
      //console.log([Math.sin(rads), Math.cos(rads)])
      if(child_n%2 == 0){
        return [Math.sin(rads)*.75, Math.cos(rads)*.75];
      }else{
        return [Math.sin(rads)*.5, Math.cos(rads)*.5];
      }
    },
    child_generator: function(n, vector, position){
      return TYPES.random_test_ember(vector, position);
    }
  });
};

TYPES.ameotrack_image = function(vector, position){
    return TYPES.basic_rocket(vector, position, {
    number: 30,
    vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
      rads = ((2*Math.PI)/n)*child_n;
      //console.log([Math.sin(rads), Math.cos(rads)])
      if(child_n%2 == 0){
        return [Math.sin(rads)*.75, Math.cos(rads)*.75];
      }else{
        return [Math.sin(rads)*.5, Math.cos(rads)*.5];
      }
    },
    child_generator: function(n, vector, position){
      return TYPES.ameotrack_image_ember(vector, position);
    }
  });
};

TYPES.osutrack_pageview = function(vector, position){
    return TYPES.basic_rocket(vector, position, {
    number: 30,
    vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
      rads = ((2*Math.PI)/n)*child_n;
      //console.log([Math.sin(rads), Math.cos(rads)])
      if(child_n%2 == 0){
        return [Math.sin(rads)*.75, Math.cos(rads)*.75];
      }else{
        return [Math.sin(rads)*.5, Math.cos(rads)*.5];
      }
    },
    child_generator: function(n, vector, position){
      if(n%2 == 0){
        return TYPES.osutrack_default_ember(vector, position);
      }else{
        return TYPES.osutrack_irc_ember(vector, position);
      }
    }
  });
};

TYPES.random_test = function(){
  return {
    x: Math.random()*view.size.width,
    vector: [Math.random()*((Math.random()>.5)*-1)*4, Math.random()*4+5],
    trail_width: 3,
    trail_color: "red",
    explosion_delay: 60*3.6*Math.random()+2,
    tick: 0,
    mass: 250,
    child_fireworks: {
      number: 30,
      vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
        rads = ((2*Math.PI)/n)*child_n;
        //console.log([Math.sin(rads), Math.cos(rads)])
        if(child_n%2 == 0){
          return [Math.sin(rads)*.75, Math.cos(rads)*.75];
        }else{
          return [Math.sin(rads)*.5, Math.cos(rads)*.5];
        }
      },
      child_generator: function(n, vector, position){
        return TYPES.random_test_ember(vector, position);
      }
    },
    trail: {
      number: 2,
      vector_generator: function(n, child_n){ // n = total children fireworks; child_n is the index of current child firework
        rads = ((2*Math.PI)/n)*child_n;
        //console.log([Math.sin(rads), Math.cos(rads)])
        if(child_n%2 == 0){
          return [(Math.random()*-1)/5, 0];
        }else{
          return [(Math.random()*1)/5, 0];
        }
      },
      trail_generator: function(position, tick, width, vector, parent_vector){
        position._x += parent_vector[0] * 1+(parent_vector[0]/width/2);
        position._y += parent_vector[1] * 1+(parent_vector[0]/width/2);
        if(tick%2 == 0){
          return TYPES.random_test_trail([(((Math.random()*2)-1)/4.5), Math.random()*-1], position);
        }else{
          return false;
        }
      }
    }
  }
}

TYPES.random_test_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "purple",
    explosion_delay: 60*Math.random()+(60),
    tick: 0,
    mass: 25,
    color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }
  }
}

TYPES.osutrack_irc_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "rgb(224, 58, 197)",
    explosion_delay: 60*Math.random()+(60),
    tick: 0,
    mass: 25,
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

TYPES.osutrack_default_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "rgb(255, 55, 131)",
    explosion_delay: 60*Math.random()+(60),
    tick: 0,
    mass: 25,
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

TYPES.ameotrack_image_ember = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: 1.5,
    trail_color: "lime",
    explosion_delay: 60*Math.random()+(60),
    tick: 0,
    mass: 25,
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

TYPES.random_test_trail = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: .25,
    trail_color: "gold",
    explosion_delay: 30,
    tick: 0,
    mass: 25
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

TYPES.moe_firework_trail = function(vector, position){
  return {
    position: position,
    vector: vector,
    trail_width: .25,
    trail_color: "gold",
    explosion_delay: 30,
    tick: 0,
    mass: 0
    /*color_generator: function(fillColor, strokeColor){
      fillColor.hue += 10;
      strokeColor.hue += 10;
      return [fillColor, strokeColor];
    }*/
  }
}

//properties = {x, vector, mass, trail_width, trail_color, explosion_color, child_amount, child_velocity, child_vector(s)?, explosion_delay}
function spawn_firework(properties){
  if(properties.x){
    firework = new Path.Circle(new Point(properties.x,view.bounds.height - properties.trail_width - 5), properties.trail_width)
  }else{
    firework = new Path.Circle(properties.position, properties.trail_width);
  };
  firework.style = {
    strokeColor: properties.trail_color,
    fillColor: properties.trail_color
  };
  firework.set(properties);
  firework.pos_cache = firework.position;
}

function step_firework(firework, j){
  firework.vector[1] = firework.vector[1] - (GRAVITY*firework.mass*.0055);
  /*firework.position.x = firework.position.x - firework.vector[0]
  firework.position.y = firework.position.y - firework.vector[1];*/
  var pos_cache = firework.pos_cache - firework.vector;
  firework.position = pos_cache;
  firework.pos_cache = pos_cache;
  //console.log([firework.position,firework.pos_cache]);
  if(pos_cache.y  > view.size.height){
    firework.remove()
  }
  //console.log(typeof(firework.color_generator));
  if(typeof(firework.color_generator) == "function"){
    color_mod = firework.color_generator(firework.fillColor, firework.strokeColor);
    firework.fillColor = color_mod[0];
    firework.strokeColor = color_mod[1];
  }
  if(typeof(firework.trail) == "object" && quality > 1){
    if(firework.trail.trail_generator(pos_cache, firework.tick, firework.trail_width, firework.trail.vector_generator(firework.trail.number, k), firework.vector)){
      for(var k = 0; k < firework.trail.number; k++){
        spawn_firework(firework.trail.trail_generator(pos_cache, firework.tick, firework.trail_width, firework.trail.vector_generator(firework.trail.number, k), firework.vector));
      }
    }
  }
  firework.tick++;
  if(firework.tick >= firework.explosion_delay){
    if(firework.child_fireworks){
      for(var l = 0; l < firework.child_fireworks.number; l++){
        if(firework.child_fireworks.child_generator(l, firework.child_fireworks.vector_generator(firework.child_fireworks.number, l), pos_cache)){
          spawn_firework(firework.child_fireworks.child_generator(l, firework.child_fireworks.vector_generator(firework.child_fireworks.number, l), pos_cache));
        }
      }
    }
    firework.remove()
  }
}

function onFrame(event){
  for(var j = 0; j < project.activeLayer.children.length; j++){
    step_firework(project.activeLayer.children[j], j);
  }
}

function random_spawner(){
  if(focused){
    spawn_firework(TYPES.random_test());
  }
  setTimeout(function(){
    random_spawner();
  }, 500);
}

// MAIN
var socket = new WebSocket("ws://ip.ameobea.me:7507/");

socket.onmessage = function(data){
  message = JSON.parse(data.data);
  //console.log("mesage recieved from server: " + message);
  if(message.type == "event"){
    console.log("New event: " + JSON.stringify(message));
    spawn_firework(TYPES[message.category]());
  }
}

socket.onerror = function (error) {
  console.log('WebSocket Error ' + error);
};

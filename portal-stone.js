/*
PortalStone: Simple teleportation between two objects.
caislean-west / 8-2018
*/

AFRAME.registerComponent('portal-traveller', {
		schema: { type: 'number', default: 1 },
		init: function() {
				var hit = document.querySelector("a-entity[teleport-controls]");
				var self = this;
				this.el.sceneEl.addEventListener('portal-announce', function(event) {
								if (event.detail.travdata == self.data) {
									var p = event.detail.pos;
									var pstr = ""+p.x+" "+p.y+" "+p.z;
									console.log("Traveller #"+self.data+" moving to: "+pstr);
									self.el.setAttribute("position", p);
									hit.setAttribute("teleport-controls", "hitYRegister: "+p.y);
								}
				});
		}
});

AFRAME.registerComponent('portal-stone', {
		schema: { 
			targetid: { type: 'string' },
			method: { type: 'string', default: 'teleport' },
			boxDist: { type: 'number', default: 0 }
		},
		applyGlowAnim: function() {
			var elem = document.createElement('a-animation');
			elem.setAttribute("attribute", "material.emissive"); 
			elem.setAttribute("from", "#000000"); 
			elem.setAttribute("to", "#132d2d"); 
			elem.setAttribute("dur", "700"); 
			elem.setAttribute("direction", "alternate"); 
			elem.setAttribute("repeat", "indefinite");
			elem.setAttribute("easing", "ease-sine");
			if (this.data.method == "point") {
				elem.setAttribute("begin", "mouseenter"); 
				elem.setAttribute("end", "mouseleave");
			}
			this.el.appendChild(elem);
		},
		checkBoxDist: function(posA, posB, dist) {
			if (dist <= 0) return false;
			//add 1cm margin, in case object is a collidable cube
			dist += this.boxMargin;
			if (Math.abs(posA.x - posB.x) < dist && Math.abs(posA.y - posB.y) < dist && Math.abs(posA.z - posB.z) < dist) {
				return true;
			} else {
				return false;
			}
		},
		announceTargetPortal: function(self) {
			var targetid = this.data.targetid;
			var p = this.targetElem.getAttribute("position");
			var pstr = ""+p.x+" "+p.y+" "+p.z;
			console.log("Portal to "+targetid+" is announcing "+pstr);
			self.el.emit('portal-announce', { travdata: 1, pos: p }, true);
		},
		init: function() {
			// Make the teleport stone glow according to method
			this.applyGlowAnim();

			// Internal variables
			var targetid = this.data.targetid;
			this.targetElem = document.querySelector("#"+targetid);
			this.boxMargin = 0.1;

			// Determine appropriate teleport hit box size for prims, if not set
			if (this.data.boxDist <= 0) {
				if (this.el.getAttribute("geometry").primitive) {
					var geo = this.el.getAttribute("geometry");
					var scale = this.el.getAttribute("scale");
					if (geo.primitive == "box") {
						var w = scale.x;
						var d = scale.z;
						var dist = (w > d) ? w : d;
						this.data.boxDist = dist / 2;
						console.log("BOX "+this.data.boxDist);
					} else {
						// default value for primitive objects
						console.log("PortalStone: default primitive hitbox is 1.");
						this.data.boxDist = 1;
					}
				} else {
					// default value for non-primitive objects
					console.log("PortalStone: default primitive hitbox is 0.");
					this.data.boxDist = 0;
				}
			} 

			// Set up listeners
			var self = this;
			if (this.data.method == 'teleport') {
				var teleCtrlElem = document.querySelector("a-entity[teleport-controls]");
				teleCtrlElem.addEventListener('teleported', function(event) {
						var telePos = event.detail.hitPoint;
						var stonePos = self.el.getAttribute("position");
						if (self.checkBoxDist(telePos, stonePos, self.data.boxDist)) {
								self.announceTargetPortal(self);
						}
				});
			} else if (this.data.method == 'point') {
	      this.el.addEventListener('mouseleave', function () {
						self.announceTargetPortal(self);
	      });
			}
		}
});

AFRAME.registerComponent('portal-speaker', {
		schema: { type: 'string', default: "Speaker" },
		init: function() {
				console.log(""+this.data+" was born.");
				var self = this;
				this.el.sceneEl.addEventListener('portal-announce', function(event) {
						console.log(""+self.data+" heard event: "+event.details.toString());
				});
		}
});

AFRAME.registerComponent('teleport-log', {
		init: function() {
				var self = this;
				this.el.addEventListener('teleported', function(event) {
						var d = event.detail;
						from = d.oldPosition.toArray().toString();
						to = d.newPosition.toArray().toString();
						hit = d.hitPoint.toArray().toString();
						console.log("Teleported: "+from+" -> "+to+", Hitpoint: "+hit);
				});
		}
});


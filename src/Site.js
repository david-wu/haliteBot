const _ = require('lodash')
const log = require('./log.js')

class Site {

	constructor(options){
		_.extend(this, options);
		_.extend(this, {
			isMine: this.gameMap.myId===this.owner,
		})
		_.extend(this, {
			isHostile: !this.isMine && this.owner>0,
			isNeutral: this.owner===0,
			willBeMovedHere: [],
			moved: false,
			fronts: {
				north: {
					key: 'north',
					index: 1,
					reverseIndex: 3,
				},
				east: {
					key: 'east',
					index: 2,
					reverseIndex: 4,
				},
				south: {
					key: 'south',
					index: 3,
					reverseIndex: 1,
				},
				west: {
					key: 'west',
					index: 4,
					reverseIndex: 2
				},
			},
		})
	}

	frontsByEfficiency(){
		const frontsByEfficiency = _.sortBy(this.fronts, function(front){
			return -front.efficiency;
		});

		// prevent going back and forth
		_.remove(frontsByEfficiency, function(front){
			return front.reverseIndex === frontsByEfficiency[0].index
		})
		frontsByEfficiency.length = 2;

		return frontsByEfficiency;
	}

	setClosestHostileFront(){
	    const hostileFronts = _.sortBy(this.fronts, 'distanceToHostile');
	    this.closestHostileFront = hostileFronts[0];
	    return this.closestHostileFront;
	}

	isInCommandZone(){
	    this.setClosestHostileFront();
	    if(this.closestHostileFront.distanceToHostile<=3){
	      return true;
	    }
	}

	expectedStrength(){
		const addedStrength = _.reduce(this.willBeMovedHere, function(strength, movedSite){
			return strength+movedSite.strength
		}, this.strength)

		if(!this.isMine || this.moved){
			return addedStrength - this.strength;
		}else{
			return addedStrength;
		}
	}

	neighborsByAdjacentHostilesCount(){
		return _.sortBy(this.neighbors(), function(neighbor){
			const hostileSquares = (neighbor.isHostile ? 1 : 0) + neighbor.hostileNeighbors().length;
			const friendlySquares = neighbor.isMineNeighbors().length
			return -(hostileSquares - friendlySquares)
		})
	}

	// not exactly correct
	isMineNeighbors(){
		return _.filter(this.neighbors(), function(neighbor){
			return neighbor.isMine
			// return (neighbor.isMine && neighbor.strength>20) || neighbor.willBeMovedHere.length;
		})
	}

	hostileNeighbors(){
		return _.filter(this.neighbors(), function(neighbor){
			return neighbor.isHostile
		})
	}

	moveTo(targetSite){
		if(this.moved){
			log('already moved')
			return;
		}
		targetSite.willBeMovedHere.push(this);
		this.moved = true;
		const direction = _.indexOf(this.neighbors(), targetSite)+1
		if(!direction){
			log('should have dir')
			return;
		}
		return {
			loc: {
				x: this.x,
				y: this.y,
			},
			direction: direction || 0
		}
	}


	// Assuming targetSite is moved away and nothing new moves onto it
	getMinWaste(targetSite){
		return this.getWaste(targetSite)-targetSite.strength;
	}

	getWaste(targetSite){
		return this.strength + targetSite.expectedStrength()-255;
	}

	eachNeighbor(iteratee){
		_.each(this.neighbors(), function(neighbor){
			iteratee(neighbor);
		})
	}

	neighbors(){
		return [
		this.neighbor('north'),
		this.neighbor('east'),
		this.neighbor('south'),
		this.neighbor('west'),
		]
	}

	neighbor(direction){
		return this.gameMap.getSite(this, directionIndices[direction])
	}

	pos(){
		return [this.x, this.y]
	}

}


const directionIndices = {
	north: 1,
	east: 2,
	south: 3,
	west: 4
};


module.exports = Site;
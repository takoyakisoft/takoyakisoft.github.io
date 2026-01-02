extends CharacterBody2D

const SPEED = 100.0
var player = null

func _ready():
	player = get_parent().get_node_or_null("Player")

func _physics_process(delta):
	if player:
		var direction = (player.global_position - global_position).normalized()
		velocity = direction * SPEED
		move_and_slide()

		for i in get_slide_collision_count():
			var collision = get_slide_collision(i)
			var collider = collision.get_collider()
			if collider.name == "Player":
				print("Player hit! Game Over logic here.")
				# For now, just reload scene to restart
				GGT.restart_scene()

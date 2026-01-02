extends CharacterBody2D

const SPEED = 200.0
const FRICTION = 800.0
var Bullet = preload("res://scenes/weapon/bullet.tscn")
var fire_timer = 0.0
const FIRE_RATE = 0.5

func _physics_process(delta):
	var direction = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if direction:
		velocity = direction * SPEED
	else:
		velocity = velocity.move_toward(Vector2.ZERO, FRICTION * delta)

	move_and_slide()

	# Auto fire
	fire_timer += delta
	if fire_timer >= FIRE_RATE:
		fire_timer = 0
		fire_at_nearest_enemy()

func fire_at_nearest_enemy():
	# NOTE: get_nodes_in_group can be expensive with many enemies.
	# For an MVP/Game Jam scope, this is acceptable.
	# Optimization: maintain a global list of enemies or use a spatial query.
	var enemies = get_tree().get_nodes_in_group("enemy")
	var nearest_enemy = null
	var min_dist = INF

	for enemy in enemies:
		var dist = global_position.distance_to(enemy.global_position)
		if dist < min_dist:
			min_dist = dist
			nearest_enemy = enemy

	if nearest_enemy:
		var bullet = Bullet.instantiate()
		bullet.global_position = global_position
		bullet.direction = (nearest_enemy.global_position - global_position).normalized()
		# Add child to parent (Gameplay scene) so bullets are cleaned up when scene restarts.
		# Ideally use a dedicated node for projectiles, but parent works for simple hierarchy.
		get_parent().add_child(bullet)

extends Area2D

const SPEED = 600.0
const BULLET_LIFETIME = 2.0
var direction = Vector2.RIGHT
var damage := 6.0
var crit_chance := 0.05


func _ready():
	# Delete bullet after BULLET_LIFETIME seconds to avoid memory leak if it misses
	await get_tree().create_timer(BULLET_LIFETIME).timeout
	queue_free()


func _physics_process(delta):
	position += direction * SPEED * delta


func _on_body_entered(body):
	if body.is_in_group("enemy"):
		var final_damage = damage
		if randf() < crit_chance:
			final_damage *= 1.6
		if body.has_method("apply_damage"):
			body.apply_damage(final_damage)
		queue_free()

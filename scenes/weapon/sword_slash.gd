extends Area2D

var damage := 10.0
var crit_chance := 0.05
var duration := 0.2

func _ready() -> void:
	$AnimationPlayer.play("slash")
	body_entered.connect(_on_body_entered)
	await get_tree().create_timer(duration).timeout
	queue_free()

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("enemy"):
		var final_damage = damage
		if randf() < crit_chance:
			final_damage *= 1.8
		body.apply_damage(final_damage)

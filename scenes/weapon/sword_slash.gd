extends Area2D

var damage := 10.0
var crit_chance := 0.05
var duration := 0.2
var virus_stats: Dictionary = {}
var stun_duration := 0.0
var tentacle_mark_duration := 0.0
var tint_color := Color(1.5, 1.5, 2.0, 1.0)
var tentacle_visual := false


func _ready() -> void:
	# Hide sprite if it exists, as we draw manually
	if has_node("Sprite2D"):
		$Sprite2D.visible = false

	# Setup visual
	queue_redraw()

	modulate = tint_color  # Start bright
	var tween = create_tween()
	tween.tween_property(self, "modulate", Color(1, 1, 1, 0.0), duration)
	tween.tween_callback(queue_free)

	body_entered.connect(_on_body_entered)


func _draw() -> void:
	var shape_node = get_node_or_null("CollisionShape2D")
	if shape_node and shape_node.shape is CircleShape2D:
		var r = shape_node.shape.radius
		draw_circle(Vector2.ZERO, r, Color(1, 1, 1, 0.2))
		draw_arc(Vector2.ZERO, r, 0, TAU, 32, Color(1, 1, 1, 0.8), 4.0)
		if tentacle_visual:
			var spikes = 12
			var spike_len = r * 0.35
			for i in range(spikes):
				var angle = TAU * float(i) / float(spikes)
				var dir = Vector2(cos(angle), sin(angle))
				draw_line(
					dir * (r * 0.6), dir * (r * 0.6 + spike_len), Color(0.4, 1.0, 0.6, 0.9), 3.0
				)


func _on_body_entered(body: Node) -> void:
	if body.is_in_group("enemy"):
		var final_damage = damage
		if randf() < crit_chance:
			final_damage *= 1.8
		if body.has_method("apply_damage"):
			body.apply_damage(final_damage)
		if stun_duration > 0.0 and body.has_method("apply_stun"):
			body.apply_stun(stun_duration)
		if tentacle_mark_duration > 0.0 and body.has_method("apply_tentacle_mark"):
			body.apply_tentacle_mark(tentacle_mark_duration)
		if not virus_stats.is_empty() and body.has_method("apply_virus"):
			body.apply_virus(virus_stats)

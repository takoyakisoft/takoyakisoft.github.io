extends Label

const LIFETIME := 0.8

var velocity := Vector2.ZERO
var elapsed := 0.0

func setup(amount: float, is_player: bool) -> void:
	text = str(int(round(amount)))
	var intensity = clamp(amount / 25.0, 0.2, 2.5)
	var base_color = Color("ff5a5a") if not is_player else Color("4ad9ff")
	modulate = base_color.lerp(Color.WHITE, clamp(intensity * 0.3, 0.0, 1.0))
	scale = Vector2.ONE * (0.8 + intensity * 0.4)
	velocity = Vector2(randf_range(-18.0, 18.0), randf_range(-60.0, -90.0))
	rotation = randf_range(-0.2, 0.2)

func _process(delta: float) -> void:
	elapsed += delta
	position += velocity * delta
	velocity.y += 120.0 * delta
	var fade = 1.0 - (elapsed / LIFETIME)
	modulate.a = max(fade, 0.0)
	if elapsed >= LIFETIME:
		queue_free()

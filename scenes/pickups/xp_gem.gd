extends Area2D

var value := 1
var gem_color := Color("4ddc5b")

@onready var sprite := $Sprite2D

func setup(new_value: int, new_color: Color) -> void:
	value = new_value
	gem_color = new_color
	sprite.modulate = gem_color

func _ready() -> void:
	add_to_group("xp_gem")
	area_entered.connect(_on_area_entered)
	$AnimationPlayer.play("float")

func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("xp_pickup"):
		var player = area.get_parent()
		if player and player.is_in_group("player"):
			player.gain_xp(value)
			queue_free()

extends CharacterBody2D

const BASE_SPEED = 100.0
const BASE_HP = 20.0
const BASE_DAMAGE = 8.0
const HIT_COOLDOWN = 0.6

var player: Node = null
var max_hp := BASE_HP
var hp := BASE_HP
var damage := BASE_DAMAGE
var speed := BASE_SPEED
var is_boss := false
var hit_timer := 0.0


func setup(stats: Dictionary) -> void:
	max_hp = stats.get("max_hp", BASE_HP)
	hp = max_hp
	damage = stats.get("damage", BASE_DAMAGE)
	speed = stats.get("speed", BASE_SPEED)
	is_boss = stats.get("is_boss", false)
	if is_boss:
		scale = Vector2(1.8, 1.8)
		var sprite = get_node_or_null("Sprite2D")
		if sprite:
			sprite.modulate = Color("ff9f4a")


func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")


func _physics_process(delta: float) -> void:
	hit_timer = max(hit_timer - delta, 0.0)
	if not player:
		player = get_tree().get_first_node_in_group("player")

	if player:
		var direction = (player.global_position - global_position).normalized()
		velocity = direction * speed
		move_and_slide()

		for i in range(get_slide_collision_count()):
			var collision = get_slide_collision(i)
			var collider = collision.get_collider()
			if collider and collider.is_in_group("player") and hit_timer <= 0.0:
				hit_timer = HIT_COOLDOWN
				if collider.has_method("apply_damage"):
					collider.apply_damage(damage)


func apply_damage(amount: float) -> void:
	hp -= amount
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.spawn_damage_number(global_position, amount, false)
	if hp <= 0:
		die()


func die() -> void:
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.on_enemy_defeated(global_position, is_boss)
	queue_free()

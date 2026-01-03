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
var is_minion := false
var minion_duration := 0.0
var minion_timer := 0.0
var external_velocity := Vector2.ZERO
var stun_timer := 0.0
var tentacle_mark_timer := 0.0
var orbit_active := false
var orbit_timer := 0.0
var orbit_duration := 0.0
var orbit_radius := 120.0
var orbit_speed := 240.0
var orbit_sign := 1.0
var orbit_center: Node2D = null
var fling_active := false
var fling_damage := 0.0
var fling_speed := 380.0
var virus_active := false
var virus_timer := 0.0
var virus_damage := 0.0
var virus_radius := 0.0
var virus_tick := 0.7
var virus_chain_remaining := 0
var virus_duration := 0.0
var virus_time_left := 0.0
var base_modulate := Color(1, 1, 1, 1)
var base_modulate_set := false

@onready var status_label := $StatusLabel


func setup(stats: Dictionary) -> void:
	max_hp = stats.get("max_hp", BASE_HP)
	hp = max_hp
	damage = stats.get("damage", BASE_DAMAGE)
	speed = stats.get("speed", BASE_SPEED)
	is_boss = stats.get("is_boss", false)
	var sprite = get_node_or_null("Sprite2D")
	if sprite and stats.has("tint"):
		sprite.modulate = stats["tint"]
		base_modulate = sprite.modulate
		base_modulate_set = true
	if is_boss:
		scale = Vector2(1.8, 1.8)
		if sprite:
			sprite.modulate = stats.get("tint", Color("ff9f4a"))
			base_modulate = sprite.modulate
			base_modulate_set = true


func setup_minion(stats: Dictionary) -> void:
	is_minion = true
	is_boss = false
	remove_from_group("enemy")
	add_to_group("ally")
	max_hp = stats.get("minion_hp", 25.0)
	hp = max_hp
	damage = stats.get("minion_damage", BASE_DAMAGE)
	speed = stats.get("minion_speed", BASE_SPEED)
	minion_duration = stats.get("minion_duration", 8.0)
	scale = Vector2(1.2, 1.2)
	var sprite = get_node_or_null("Sprite2D")
	if sprite:
		sprite.modulate = Color("6dff95")
		base_modulate = sprite.modulate
		base_modulate_set = true


func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	if not base_modulate_set:
		var sprite = get_node_or_null("Sprite2D")
		if sprite:
			base_modulate = sprite.modulate
			base_modulate_set = true


func _physics_process(delta: float) -> void:
	hit_timer = max(hit_timer - delta, 0.0)
	tentacle_mark_timer = max(tentacle_mark_timer - delta, 0.0)
	stun_timer = max(stun_timer - delta, 0.0)
	_update_status_label()
	if is_minion:
		_process_minion(delta)
		return
	if orbit_active:
		_process_orbit(delta)
		if virus_active:
			_process_virus(delta)
		return
	if fling_active:
		_process_fling(delta)
		if virus_active:
			_process_virus(delta)
		return
	if stun_timer > 0.0:
		velocity = Vector2.ZERO
		move_and_slide()
		if virus_active:
			_process_virus(delta)
		return
	if not player:
		player = get_tree().get_first_node_in_group("player")

	if player:
		var direction = (player.global_position - global_position).normalized()
		velocity = direction * speed + external_velocity
		move_and_slide()
		external_velocity = external_velocity.move_toward(Vector2.ZERO, 800.0 * delta)

		for i in range(get_slide_collision_count()):
			var collision = get_slide_collision(i)
			var collider = collision.get_collider()
			if collider and collider.is_in_group("player") and hit_timer <= 0.0:
				hit_timer = HIT_COOLDOWN
				if collider.has_method("apply_damage"):
					collider.apply_damage(damage)
	if virus_active:
		_process_virus(delta)


func apply_damage(amount: float) -> void:
	hp -= amount
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.spawn_damage_number(global_position, amount, false)
	if hp <= 0:
		die()


func die() -> void:
	if is_minion:
		queue_free()
		return
	if virus_active:
		_spread_virus_on_death()
	var gameplay = get_tree().get_first_node_in_group("gameplay")
	if gameplay:
		gameplay.on_enemy_defeated(global_position, is_boss, self)
	queue_free()


func apply_external_velocity(force: Vector2) -> void:
	external_velocity += force


func apply_orbit(center: Node2D, stats: Dictionary) -> void:
	if is_minion:
		return
	orbit_active = true
	orbit_timer = 0.0
	orbit_duration = max(stats.get("orbit_duration", 2.0), 0.2)
	orbit_radius = max(stats.get("orbit_radius", 120.0), 40.0)
	orbit_speed = max(stats.get("orbit_speed", 240.0), 60.0)
	orbit_sign = 1.0 if randf() < 0.5 else -1.0
	orbit_center = center
	fling_damage = stats.get("fling_damage", 10.0)
	fling_speed = stats.get("fling_speed", 380.0)
	fling_active = false
	external_velocity = Vector2.ZERO


func _process_orbit(delta: float) -> void:
	orbit_timer += delta
	if not is_instance_valid(orbit_center):
		orbit_active = false
		return
	var center_pos = orbit_center.global_position
	var to_center = center_pos - global_position
	var dist = max(to_center.length(), 0.01)
	var tangent = Vector2(-to_center.y, to_center.x).normalized() * orbit_sign
	var radial_correction = (dist - orbit_radius) * 3.0
	velocity = tangent * orbit_speed + to_center.normalized() * radial_correction
	move_and_slide()
	if orbit_timer >= orbit_duration:
		orbit_active = false
		var away = (global_position - center_pos).normalized()
		external_velocity = away * max(fling_speed, 120.0)
		fling_active = true


func _process_fling(delta: float) -> void:
	velocity = external_velocity
	move_and_slide()
	external_velocity = external_velocity.move_toward(Vector2.ZERO, 900.0 * delta)
	if external_velocity.length() < 10.0:
		fling_active = false
		return
	for i in range(get_slide_collision_count()):
		var collision = get_slide_collision(i)
		var collider = collision.get_collider()
		if collider and collider.is_in_group("enemy") and collider != self:
			if collider.has_method("apply_damage"):
				collider.apply_damage(fling_damage)


func apply_stun(duration: float) -> void:
	if is_minion:
		return
	stun_timer = max(stun_timer, duration)


func apply_tentacle_mark(duration: float) -> void:
	if is_minion:
		return
	tentacle_mark_timer = max(tentacle_mark_timer, duration)


func is_tentacle_marked() -> bool:
	return tentacle_mark_timer > 0.0


func _update_status_label() -> void:
	if not is_instance_valid(status_label):
		return
	var tags: Array[String] = []
	if is_minion:
		tags.append("使役")
	if virus_active:
		tags.append("ウィルス")
	if tags.is_empty():
		status_label.visible = false
		return
	status_label.visible = true
	status_label.text = " / ".join(tags)
	if tags.size() == 1:
		if tags[0] == "使役":
			status_label.modulate = Color(0.6, 1.0, 0.7, 1.0)
		elif tags[0] == "ウィルス":
			status_label.modulate = Color(0.75, 0.5, 1.0, 1.0)
	else:
		status_label.modulate = Color(1, 1, 1, 1)


func apply_virus(stats: Dictionary) -> void:
	if is_minion:
		return
	if randf() > stats.get("virus_chance", 0.0):
		return
	var chain = int(round(stats.get("virus_chain", 0.0)))
	force_virus(stats, chain)


func force_virus(stats: Dictionary, chain_remaining: int) -> void:
	if is_minion:
		return
	virus_active = true
	virus_damage = max(virus_damage, stats.get("virus_damage", 0.0))
	virus_radius = max(virus_radius, stats.get("virus_radius", 0.0))
	virus_tick = max(0.1, stats.get("virus_tick", 0.7))
	virus_chain_remaining = max(virus_chain_remaining, chain_remaining)
	virus_duration = max(virus_duration, stats.get("virus_duration", 0.0))
	virus_time_left = max(virus_time_left, virus_duration)
	_apply_virus_visual(true)


func _process_virus(delta: float) -> void:
	virus_time_left = max(virus_time_left - delta, 0.0)
	if virus_time_left <= 0.0:
		_clear_virus()
		return
	virus_timer += delta
	if virus_timer < virus_tick:
		return
	virus_timer = 0.0
	apply_damage(virus_damage)


func _find_virus_target() -> Node:
	var nearest = null
	var min_dist = INF
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(enemy):
			continue
		if enemy == self:
			continue
		if enemy.get("virus_active"):
			continue
		var dist = global_position.distance_to(enemy.global_position)
		if dist <= virus_radius and dist < min_dist:
			min_dist = dist
			nearest = enemy
	return nearest


func _spread_virus_on_death() -> void:
	if virus_chain_remaining <= 0:
		return
	var spreads = virus_chain_remaining
	var targets: Array = []
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(enemy):
			continue
		if enemy == self:
			continue
		if enemy.get("virus_active"):
			continue
		var dist = global_position.distance_to(enemy.global_position)
		if dist <= virus_radius:
			targets.append(enemy)
	targets.shuffle()
	for i in range(min(spreads, targets.size())):
		var target = targets[i]
		(
			target
			. force_virus(
				{
					"virus_damage": virus_damage,
					"virus_radius": virus_radius,
					"virus_tick": virus_tick,
					"virus_duration": virus_duration,
				},
				spreads - 1
			)
		)


func _clear_virus() -> void:
	virus_active = false
	virus_timer = 0.0
	virus_chain_remaining = 0
	virus_duration = 0.0
	virus_time_left = 0.0
	_apply_virus_visual(false)


func _apply_virus_visual(active: bool) -> void:
	var sprite = get_node_or_null("Sprite2D")
	if not sprite:
		return
	if active:
		sprite.modulate = base_modulate.lerp(Color("2aff67"), 0.5)
	else:
		sprite.modulate = base_modulate


func _process_minion(delta: float) -> void:
	minion_timer += delta
	if minion_duration > 0.0 and minion_timer >= minion_duration:
		queue_free()
		return

	var target = _find_minion_target()
	if target:
		var direction = (target.global_position - global_position).normalized()
		velocity = direction * speed + external_velocity
	else:
		velocity = external_velocity
	move_and_slide()
	external_velocity = external_velocity.move_toward(Vector2.ZERO, 800.0 * delta)

	for i in range(get_slide_collision_count()):
		var collision = get_slide_collision(i)
		var collider = collision.get_collider()
		if collider and collider.is_in_group("enemy") and hit_timer <= 0.0:
			hit_timer = HIT_COOLDOWN
			if collider.has_method("apply_damage"):
				collider.apply_damage(damage)


func _find_minion_target() -> Node:
	var nearest = null
	var min_dist = INF
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(enemy):
			continue
		var dist = global_position.distance_to(enemy.global_position)
		if dist < min_dist:
			min_dist = dist
			nearest = enemy
	return nearest

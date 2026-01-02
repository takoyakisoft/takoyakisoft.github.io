extends GdUnitTestSuite


func test_get_xp_required(
	level: int, expected: int, _test_parameters := [[1, 19], [2, 28], [5, 60]]
) -> void:
	assert_int(GameData.get_xp_required(level)).is_equal(expected)


func test_get_wave_settings_boss() -> void:
	var settings = GameData.get_wave_settings(11)
	assert_bool(settings.boss).is_true()
	assert_float(settings.spawn_rate).is_equal(1.0)
	assert_float(settings.enemy_hp_multiplier).is_equal(5.0)


func test_wave_scaling() -> void:
	# Wave 5: Linear scaling
	var w5 = GameData.get_wave_settings(5)
	# spawn_rate = max(0.8 - (5-1)*0.05, 0.5) = 0.8 - 0.2 = 0.6
	assert_float(w5.spawn_rate).is_between(0.5999, 0.6001)

	# Wave 6: Exponential scaling start
	var w6 = GameData.get_wave_settings(6)
	# expo = 6-5 = 1.0
	# spawn_rate = max(0.5 * pow(0.85, 1.0), 0.05) = 0.5 * 0.85 = 0.425
	assert_float(w6.spawn_rate).is_between(0.4249, 0.4251)


func test_relic_stats_scaling() -> void:
	# Pistol level 1
	var l1 = GameData.get_relic_stats("pistol", 1)
	assert_float(l1.damage).is_equal(6.0)
	assert_float(l1.cooldown).is_equal(0.55)

	# Pistol level 2
	var l2 = GameData.get_relic_stats("pistol", 2)
	# Base 6.0 + 1.6 * 1 = 7.6
	assert_float(l2.damage).is_equal(7.6)
	# Base 0.55 - 0.03 * 1 = 0.52
	assert_float(l2.cooldown).is_between(0.5199, 0.5201)

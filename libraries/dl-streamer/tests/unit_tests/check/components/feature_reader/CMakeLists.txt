# ==============================================================================
# Copyright (C) 2020-2025 Intel Corporation
#
# SPDX-License-Identifier: MIT
# ==============================================================================

set(TARGET_NAME "test_feature_reader")

find_package(PkgConfig REQUIRED)

pkg_check_modules(GSTCHECK gstreamer-check-1.0 REQUIRED)
pkg_check_modules(GSTREAMER gstreamer-1.0>=1.16 REQUIRED)
pkg_check_modules(GLIB2 glib-2.0 REQUIRED)

project(${TARGET_NAME})

set(TEST_SOURCES
    main_test.cpp
    feature_env_reader_test.cpp
)

add_executable(${TARGET_NAME} ${TEST_SOURCES})

target_link_libraries(${TARGET_NAME}
PRIVATE
    gtest
    gmock
    common
    test_common
    test_utils
    ${GSTREAMER_LIBRARIES}
    ${GSTCHECK_LIBRARIES}
    ${GLIB2_LIBRARIES}
    runtime_feature_toggling
)
target_include_directories(${TARGET_NAME}
PRIVATE
    ${GSTCHECK_INCLUDE_DIRS}
    ${GSTREAMER_INCLUDE_DIRS}
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${GLIB2_INCLUDE_DIRS}
)

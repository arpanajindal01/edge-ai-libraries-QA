# ==============================================================================
# Copyright (C) 2018-2025 Intel Corporation
#
# SPDX-License-Identifier: MIT
# ==============================================================================

set (TARGET_NAME "elements")

find_package(OpenCV REQUIRED core imgproc)
find_package(PkgConfig REQUIRED)
pkg_check_modules(GSTREAMER gstreamer-1.0>=1.16 REQUIRED)
pkg_check_modules(GSTVIDEO gstreamer-video-1.0>=1.16 REQUIRED)
pkg_check_modules(GSTALLOC gstreamer-allocators-1.0 REQUIRED)
if(${ENABLE_AUDIO_INFERENCE_ELEMENTS})
        pkg_check_modules(GSTAUDIO gstreamer-audio-1.0>=1.16 REQUIRED)
endif()

file (GLOB MAIN_SRC
    gvametaconvert/*.cpp
    gvametaconvert/*.c
    gvametaaggregate/*.cpp
    gvametaaggregate/*.c
    gvawatermark/*.cpp
    gvawatermark/renderer/*.cpp
    gvawatermark/renderer/cpu/*.cpp
    gvawatermark/*.c
)

file (GLOB MAIN_HEADERS
    gvametaconvert/*.h
    gvametaaggregate/*.h
    gvawatermark/*.h
    gvawatermark/renderer/*.h
    gvawatermark/renderer/cpu/*.h
)

if(${ENABLE_AUDIO_INFERENCE_ELEMENTS})
    file (GLOB AUDIO_SRC
        gvametaconvert/audioconverter/*.cpp
    )
    file (GLOB AUDIO_HEADERS
        gvametaconvert/audioconverter/*.h
    )
    list (APPEND MAIN_SRC ${AUDIO_SRC})
    list (APPEND MAIN_HEADERS ${AUDIO_HEADERS})
endif()

add_library(${TARGET_NAME} STATIC ${MAIN_SRC} ${MAIN_HEADERS})
set_compile_flags(${TARGET_NAME})

target_include_directories(${TARGET_NAME}
PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    gvametaconvert
    gvawatermark
    gvawatermark/renderer
    gvametaaggregate
PRIVATE
    ${GSTREAMER_INCLUDE_DIRS}
    ${GSTVIDEO_INCLUDE_DIRS}
    ${GSTALLOC_INCLUDE_DIRS}
)

if(${ENABLE_AUDIO_INFERENCE_ELEMENTS})
    target_include_directories(${TARGET_NAME}
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/gvametaconvert/audioconverter
        ${GSTAUDIO_INCLUDE_DIRS}
    )
endif()
target_link_libraries(${TARGET_NAME}
PRIVATE
    ${GSTREAMER_LIBRARIES}
    ${GSTVIDEO_LIBRARIES}
    ${GSTALLOC_LIBRARIES}
    ${OpenCV_LIBS}
    dlstreamer_api
    common
    image_inference
    image_inference_openvino
    logger
    json-hpp
    json-schema-validator
    utils
)

if(${ENABLE_AUDIO_INFERENCE_ELEMENTS})
        target_link_libraries(${TARGET_NAME} PRIVATE ${GSTAUDIO_LIBRARIES})
endif()

if(${ENABLE_VAAPI})
        target_link_libraries(${TARGET_NAME} PRIVATE image_inference_async)
endif()

add_subdirectory(gvaattachroi)
add_subdirectory(gvametapublish)
add_subdirectory(gvapython)
add_subdirectory(gvatrack)
add_subdirectory(gvadeskew)
add_subdirectory(gvawatermark3d)
if(ENABLE_GENAI)
    add_subdirectory(gvagenai)
endif()

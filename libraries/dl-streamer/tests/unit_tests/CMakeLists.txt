# ==============================================================================
# Copyright (C) 2018-2025 Intel Corporation
#
# SPDX-License-Identifier: MIT
# ==============================================================================

add_subdirectory(check)
add_subdirectory(test_utils)
if(${ENABLE_FUZZING})
    add_subdirectory(fuzzing)
endif()

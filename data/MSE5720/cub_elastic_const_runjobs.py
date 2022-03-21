# Written by Massey Cashore and Sabrina Li Fall 2018
# Updated by Sabrina Li sjl57@cornell
# 24 Mar 2020
# Updates: for cubic system, using T matrices listen on page 10 of Ritz and Yang
# now includes a RUN_JOBS boolean
# Purpose: run jobs to calculate bulk modulus, C11, C12, and C44 elastic constants of cubic system
# first used for BAs, space group 216 -43m

import numpy as np
import os

from shutil import copyfile
from create_scf_file import create_scf_file


VERBOSE = False
KINDA_VERBOSE = True
RUN_JOBS = False

GAMMA_MIN_VALUE = -0.06
GAMMA_MAX_VALUE = 0.06
GAMMA_INCREMENT = 0.02
CUBIC_CELL_PARAM =0.5 

BASE_DIRECTORY = "./" #edit this if you're not running this script from the folder that contains create_scf_file

CELL_PARMETER = np.matrix([[0.0, CUBIC_CELL_PARAM ,CUBIC_CELL_PARAM ],[CUBIC_CELL_PARAM , 0.0, CUBIC_CELL_PARAM ], [ CUBIC_CELL_PARAM, CUBIC_CELL_PARAM, 0.0 ]])
PW_SCRIPT_LOCATION = "pw_script" #be sure to edit this

def construct_Ts():
    t0 = np.zeros((3,3)) #bulk modulus
    t0[0,0] = 1
    t0[1,1] = 1
    t0[2,2] = 1

    t1 = np.zeros((3,3)) #C11
    t1[0,0] = 1

    t2 = np.zeros((3,3)) #C44
    t2[0,1] = 0.5
    t2[0,2] = 0.5
    t2[1,0] = 0.5
    t2[1,2] = 0.5
    t2[2,0] = 0.5
    t2[2,1] = 0.5

    t3 = np.zeros((3,3)) #C11 + C12
    t3[0,0] = 1
    t3[1,1] = 1


    t4 = np.zeros((3,3)) #C11 - C12
    t4[0,0] = 1
    t4[1,1] = -1


    return [t0, t1, t2, t3, t4]



def run_job(T, gamma, dir_name):     # create the directory for this job run
    directory = BASE_DIRECTORY + dir_name + "/"
    if not os.path.exists(directory):
        os.makedirs(directory)

    if VERBOSE:
        print ("created directory {0}\n".format(directory))
    
    matrix = CELL_PARAMETER*(gamma*T + np.identity(3))
    filename = directory + "scf.in"
    scf_str = create_scf_file(matrix)
    scf = open(filename, "w")
    scf.write(scf_str)
    scf.close()

    if VERBOSE:
        print ("created SCF input file: {0}\n".format(filename))

    scriptname = directory + "pw_script"
    copyfile(PW_SCRIPT_LOCATION, scriptname)
    os.chmod(scriptname, 0o744)

    if VERBOSE:
        print ("copied pw_script to: {0}\n".format(scriptname))
    if RUN_JOBS:
        os.chdir(directory)
        if VERBOSE:
            print ("changed working directory to: {0}\n".format(directory))

        os.system('sbatch pw_script')
        if KINDA_VERBOSE:
            print ("executed job for directory: {0}\n".format(dir_name))


if __name__ == "__main__":
    T_list = construct_Ts()
    gamma_list  = np.around(np.arange(GAMMA_MIN_VALUE, GAMMA_MAX_VALUE + GAMMA_INCREMENT, GAMMA_INCREMENT),3)
    T_num = 0
    for T in T_list:
        for gamma in gamma_list:
            if np.abs(gamma) < 10e-10:
                gamma = 0
            dir_name = "job_T{0}_gamma{1}".format(T_num, gamma)

            run_job(T, gamma, dir_name)
        T_num += 1
